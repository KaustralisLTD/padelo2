// Tournament schedule generation utilities
import { getDbPool } from './db';

const useDatabase = !!(
  process.env.DATABASE_HOST &&
  process.env.DATABASE_USER &&
  process.env.DATABASE_PASSWORD &&
  process.env.DATABASE_NAME
);

export interface MatchSchedule {
  id?: number;
  groupId: number;
  pair1Id: number;
  pair2Id: number;
  matchDate: Date;
  courtNumber?: number;
  matchOrder: number; // Порядок игры в группе
}

/**
 * Генерация расписания игр для группы (round-robin)
 * Пара 1 играет против 2, 3, 4...
 * Пара 3 играет против 4, 2, 1...
 */
export function generateRoundRobinSchedule(pairIds: number[]): Array<{ pair1Id: number; pair2Id: number }> {
  const matches: Array<{ pair1Id: number; pair2Id: number }> = [];
  
  if (pairIds.length < 2) {
    return matches;
  }

  // Round-robin: каждая пара играет с каждой
  for (let i = 0; i < pairIds.length; i++) {
    for (let j = i + 1; j < pairIds.length; j++) {
      matches.push({
        pair1Id: pairIds[i],
        pair2Id: pairIds[j],
      });
    }
  }

  return matches;
}

/**
 * Проверка конфликта категорий (миксты не могут играть параллельно с мужчинами/женщинами)
 */
export function hasCategoryConflict(cat1: string, cat2: string): boolean {
  const isMixed1 = cat1 === 'mixed1' || cat1 === 'mixed2';
  const isMixed2 = cat2 === 'mixed1' || cat2 === 'mixed2';
  const isMaleOrFemale1 = cat1 === 'male1' || cat1 === 'male2' || cat1 === 'female1' || cat1 === 'female2';
  const isMaleOrFemale2 = cat2 === 'male1' || cat2 === 'male2' || cat2 === 'female1' || cat2 === 'female2';
  
  // Миксты конфликтуют с мужчинами и женщинами
  return (isMixed1 && isMaleOrFemale2) || (isMixed2 && isMaleOrFemale1);
}

/**
 * Генерация расписания для всех категорий турнира одновременно
 * Учитывает конфликты между категориями (миксты vs мужчины/женщины)
 * Обеспечивает параллельную игру групп
 */
export async function generateTournamentScheduleForAllCategories(
  tournamentId: number,
  availableCourts: number = 3,
  matchDurationMinutes: number = 45,
  breakMinutes: number = 15,
  startTime: Date
): Promise<MatchSchedule[]> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }

  const pool = getDbPool();

  // Получаем все группы всех категорий
  const [allGroups] = await pool.execute(
    `SELECT id, group_name, group_number, category FROM tournament_groups 
     WHERE tournament_id = ? 
     ORDER BY category, group_number`,
    [tournamentId]
  ) as any[];

  if (allGroups.length === 0) {
    throw new Error('No groups found for this tournament');
  }

  // Группируем группы по категориям
  const groupsByCategory: Record<string, any[]> = {};
  for (const group of allGroups) {
    if (!groupsByCategory[group.category]) {
      groupsByCategory[group.category] = [];
    }
    groupsByCategory[group.category].push(group);
  }

  // Генерируем все матчи для всех групп
  interface MatchWithCategory {
    groupId: number;
    category: string;
    pair1Id: number;
    pair2Id: number;
  }

  const allMatchesByCategory: Record<string, MatchWithCategory[]> = {};

  for (const [category, groups] of Object.entries(groupsByCategory)) {
    allMatchesByCategory[category] = [];
    
    for (const group of groups) {
      // Получаем все пары в группе
      const [pairs] = await pool.execute(
        `SELECT id, pair_number FROM tournament_group_pairs 
         WHERE group_id = ? AND player1_registration_id IS NOT NULL
         ORDER BY pair_number`,
        [group.id]
      ) as any[];

      if (pairs.length < 2) {
        continue;
      }

      const pairIds = pairs.map((p: any) => p.id);
      const groupMatches = generateRoundRobinSchedule(pairIds);

      for (const match of groupMatches) {
        allMatchesByCategory[category].push({
          groupId: group.id,
          category,
          pair1Id: match.pair1Id,
          pair2Id: match.pair2Id,
        });
      }
    }
  }

  // Распределяем матчи по времени с учетом конфликтов
  const scheduledMatches: MatchSchedule[] = [];
  let currentTime = new Date(startTime);
  let matchOrder = 1;

  // Создаем очередь матчей для каждой категории
  const matchQueues: Record<string, MatchWithCategory[]> = {};
  for (const [category, matches] of Object.entries(allMatchesByCategory)) {
    matchQueues[category] = [...matches];
  }

  // Пока есть нераспределенные матчи
  while (Object.values(matchQueues).some(queue => queue.length > 0)) {
    // Определяем, какие категории могут играть одновременно
    const activeCategories: string[] = [];
    const usedCourts: number[] = [];
    let courtIndex = 0;

    // Сначала пытаемся распределить мужские и женские категории
    const maleFemaleCategories = Object.keys(matchQueues).filter(
      cat => cat.startsWith('male') || cat.startsWith('female')
    );

    for (const category of maleFemaleCategories) {
      if (matchQueues[category].length > 0 && courtIndex < availableCourts) {
        // Проверяем конфликты с уже активными категориями
        const hasConflict = activeCategories.some(activeCat => 
          hasCategoryConflict(category, activeCat)
        );
        
        if (!hasConflict) {
          activeCategories.push(category);
          usedCourts.push(courtIndex + 1);
          courtIndex++;
        }
      }
    }

    // Затем пытаемся добавить миксты, если нет конфликтов
    const mixedCategories = Object.keys(matchQueues).filter(
      cat => cat.startsWith('mixed')
    );

    for (const category of mixedCategories) {
      if (matchQueues[category].length > 0 && courtIndex < availableCourts) {
        // Проверяем конфликты
        const hasConflict = activeCategories.some(activeCat => 
          hasCategoryConflict(category, activeCat)
        );
        
        if (!hasConflict) {
          activeCategories.push(category);
          usedCourts.push(courtIndex + 1);
          courtIndex++;
        }
      }
    }

    // Если нет активных категорий, значит все матчи распределены или есть проблема
    if (activeCategories.length === 0) {
      // Продолжаем с любой доступной категорией
      const availableCategory = Object.keys(matchQueues).find(
        cat => matchQueues[cat].length > 0
      );
      if (availableCategory) {
        activeCategories.push(availableCategory);
        usedCourts.push(1);
      } else {
        break; // Все матчи распределены
      }
    }

    // Распределяем матчи параллельно из разных групп одной категории
    // Берем по одному матчу из каждой активной категории, но из разных групп
    const scheduledThisRound: MatchSchedule[] = [];
    const groupsUsedThisRound = new Set<number>();

    for (let i = 0; i < activeCategories.length && scheduledThisRound.length < availableCourts; i++) {
      const category = activeCategories[i];
      const courtNumber = usedCourts[i];
      
      // Ищем матч из категории, но из группы, которая еще не использовалась в этом раунде
      let matchFound = false;
      for (let j = 0; j < matchQueues[category].length; j++) {
        const match = matchQueues[category][j];
        if (!groupsUsedThisRound.has(match.groupId)) {
          matchQueues[category].splice(j, 1);
          scheduledThisRound.push({
            groupId: match.groupId,
            pair1Id: match.pair1Id,
            pair2Id: match.pair2Id,
            matchDate: new Date(currentTime),
            courtNumber,
            matchOrder: matchOrder++,
          });
          groupsUsedThisRound.add(match.groupId);
          matchFound = true;
          break;
        }
      }
      
      // Если не нашли матч из новой группы, берем любой доступный
      if (!matchFound && matchQueues[category].length > 0) {
        const match = matchQueues[category].shift()!;
        scheduledThisRound.push({
          groupId: match.groupId,
          pair1Id: match.pair1Id,
          pair2Id: match.pair2Id,
          matchDate: new Date(currentTime),
          courtNumber,
          matchOrder: matchOrder++,
        });
      }
    }

    scheduledMatches.push(...scheduledThisRound);

    // Переходим к следующему временному слоту
    currentTime = new Date(currentTime.getTime() + (matchDurationMinutes + breakMinutes) * 60000);
  }

  return scheduledMatches;
}

/**
 * Генерация расписания для одной категории (старая функция, оставлена для обратной совместимости)
 */
export async function generateTournamentSchedule(
  tournamentId: number,
  category: string,
  availableCourts: number = 3,
  matchDurationMinutes: number = 45,
  breakMinutes: number = 15,
  startTime: Date
): Promise<MatchSchedule[]> {
  // Используем новую функцию для всех категорий, но фильтруем по нужной
  const allMatches = await generateTournamentScheduleForAllCategories(
    tournamentId,
    availableCourts,
    matchDurationMinutes,
    breakMinutes,
    startTime
  );
  
  // Фильтруем по категории
  const pool = getDbPool();
  const categoryMatches: MatchSchedule[] = [];
  
  for (const match of allMatches) {
    const [groups] = await pool.execute(
      'SELECT category FROM tournament_groups WHERE id = ?',
      [match.groupId]
    ) as any[];
    
    if (groups.length > 0 && groups[0].category === category) {
      categoryMatches.push(match);
    }
  }
  
  return categoryMatches;
}

/**
 * Сохранение расписания в БД
 */
export async function saveSchedule(matches: MatchSchedule[]): Promise<void> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }

  const pool = getDbPool();

  for (const match of matches) {
    // Проверяем, существует ли уже матч (включая матчи с NULL временем для knockout stage)
    const [existing] = await pool.execute(
      `SELECT id FROM tournament_matches 
       WHERE group_id = ? AND pair1_id = ? AND pair2_id = ?`,
      [match.groupId, match.pair1Id, match.pair2Id]
    ) as any[];

    // Проверяем, есть ли поле duration_slots
    const [columns] = await pool.execute(
      `SHOW COLUMNS FROM tournament_matches LIKE 'duration_slots'`
    ) as any[];

    const hasDurationSlots = columns.length > 0;
    const durationSlots = (match as any).durationSlots || 3; // По умолчанию 3 слота

    if (existing.length > 0) {
      // Обновляем существующий матч (включая матчи с NULL временем)
      // Убеждаемся, что matchDate передается как Date объект или строка в правильном формате
      const matchDateValue = match.matchDate instanceof Date 
        ? match.matchDate 
        : new Date(match.matchDate);
      
      if (hasDurationSlots) {
        await pool.execute(
          `UPDATE tournament_matches 
           SET match_date = ?, court_number = ?, duration_slots = ?, updated_at = NOW()
           WHERE id = ?`,
          [matchDateValue, match.courtNumber || null, durationSlots, existing[0].id]
        );
      } else {
        await pool.execute(
          `UPDATE tournament_matches 
           SET match_date = ?, court_number = ?, updated_at = NOW()
           WHERE id = ?`,
          [matchDateValue, match.courtNumber || null, existing[0].id]
        );
      }
    } else {
      // Создаем новый матч
      // Убеждаемся, что matchDate передается как Date объект или строка в правильном формате
      const matchDateValue = match.matchDate instanceof Date 
        ? match.matchDate 
        : new Date(match.matchDate);
      
      if (hasDurationSlots) {
        await pool.execute(
          `INSERT INTO tournament_matches 
           (group_id, pair1_id, pair2_id, match_date, court_number, duration_slots, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [match.groupId, match.pair1Id, match.pair2Id, matchDateValue, match.courtNumber || null, durationSlots]
        );
      } else {
        await pool.execute(
          `INSERT INTO tournament_matches 
           (group_id, pair1_id, pair2_id, match_date, court_number, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [match.groupId, match.pair1Id, match.pair2Id, matchDateValue, match.courtNumber || null]
        );
      }
    }
  }
}

/**
 * Получение расписания для группы
 */
export async function getGroupSchedule(groupId: number): Promise<MatchSchedule[]> {
  if (!useDatabase) {
    return [];
  }

  const pool = getDbPool();
  const [matches] = await pool.execute(
    `SELECT id, group_id, pair1_id, pair2_id, match_date, court_number 
     FROM tournament_matches 
     WHERE group_id = ? 
     ORDER BY match_date, court_number, id`,
    [groupId]
  ) as any[];

  return matches.map((m: any) => ({
    id: m.id,
    groupId: m.group_id,
    pair1Id: m.pair1_id,
    pair2Id: m.pair2_id,
    matchDate: new Date(m.match_date),
    courtNumber: m.court_number,
  }));
}

