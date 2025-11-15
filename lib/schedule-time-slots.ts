// Tournament schedule generation with multiple time slots
import { getDbPool } from './db';
import { generateRoundRobinSchedule, hasCategoryConflict } from './schedule';
import { MatchSchedule } from './schedule';

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

/**
 * Генерация расписания для всех категорий с множественными временными промежутками
 */
export async function generateTournamentScheduleForAllCategoriesWithTimeSlots(
  tournamentId: number,
  availableCourts: number = 3,
  matchDurationMinutes: number = 45,
  breakMinutes: number = 15,
  timeSlots: TimeSlot[]
): Promise<MatchSchedule[]> {
  try {
  const pool = getDbPool();

    console.log(`[Schedule Generation] Starting for tournament ${tournamentId}`, {
      availableCourts,
      matchDurationMinutes,
      breakMinutes,
      timeSlotsCount: timeSlots.length,
    });

  // Получаем все группы турнира, сгруппированные по категориям
  const [groups] = await pool.execute(
    `SELECT id, category, group_name, group_number 
     FROM tournament_groups 
     WHERE tournament_id = ? 
     ORDER BY category, group_number`,
    [tournamentId]
  ) as any[];

    console.log(`[Schedule Generation] Found ${groups.length} groups`);

  if (groups.length === 0) {
      console.warn(`[Schedule Generation] No groups found for tournament ${tournamentId}`);
    return [];
  }

  // Группируем по категориям
  const groupsByCategory: Record<string, any[]> = {};
  for (const group of groups) {
    if (!groupsByCategory[group.category]) {
      groupsByCategory[group.category] = [];
    }
    groupsByCategory[group.category].push(group);
  }

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
      // Проверяем, есть ли уже существующие матчи с NULL временем (например, для knockout stage)
      const [existingMatches] = await pool.execute(
        `SELECT pair1_id, pair2_id FROM tournament_matches 
         WHERE group_id = ? AND match_date IS NULL`,
        [group.id]
      ) as any[];

      if (existingMatches.length > 0) {
        // Используем существующие матчи с NULL временем
        for (const match of existingMatches) {
          allMatchesByCategory[category].push({
            groupId: group.id,
            category,
            pair1Id: match.pair1_id,
            pair2Id: match.pair2_id,
          });
        }
      } else {
        // Генерируем матчи на основе пар (round-robin)
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
  }

  // Распределяем матчи по временным промежуткам
  const scheduledMatches: MatchSchedule[] = [];
  let matchOrder = 1;

  // Создаем очередь матчей для каждой категории
  const matchQueues: Record<string, MatchWithCategory[]> = {};
  for (const [category, matches] of Object.entries(allMatchesByCategory)) {
    matchQueues[category] = [...matches];
  }

  // Обрабатываем каждый временной промежуток
  for (const timeSlot of timeSlots) {
    // Парсим дату и время
    const [year, month, day] = timeSlot.date.split('-').map(Number);
    const [startHour, startMinute] = timeSlot.startTime.split(':').map(Number);
    const [endHour, endMinute] = timeSlot.endTime.split(':').map(Number);

    const slotStart = new Date(year, month - 1, day, startHour, startMinute);
    const slotEnd = new Date(year, month - 1, day, endHour, endMinute);
    let currentTime = new Date(slotStart);

    // Пока есть время в этом промежутке и нераспределенные матчи
    while (currentTime < slotEnd && Object.values(matchQueues).some(queue => queue.length > 0)) {
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

      // Если нет активных категорий, продолжаем с любой доступной
      if (activeCategories.length === 0) {
        const availableCategory = Object.keys(matchQueues).find(
          cat => matchQueues[cat].length > 0
        );
        if (availableCategory) {
          activeCategories.push(availableCategory);
          usedCourts.push(1);
        }
      }

      // Распределяем матчи
      const scheduledThisRound: MatchSchedule[] = [];
      const groupsUsedThisRound = new Set<number>();

      for (let i = 0; i < activeCategories.length && scheduledThisRound.length < availableCourts; i++) {
        const category = activeCategories[i];
        const courtNumber = usedCourts[i];
        
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
      const nextTime = new Date(currentTime.getTime() + (matchDurationMinutes + breakMinutes) * 60000);
      
      // Если следующий слот выходит за пределы временного промежутка, переходим к следующему дню
      if (nextTime > slotEnd) {
        break; // Переходим к следующему временному промежутку
      }
      
      currentTime = nextTime;
    }
  }

    console.log(`[Schedule Generation] Generated ${scheduledMatches.length} matches`);
  return scheduledMatches;
  } catch (error: any) {
    console.error(`[Schedule Generation] Error generating schedule:`, {
      error: error.message,
      stack: error.stack,
      tournamentId,
      availableCourts,
      matchDurationMinutes,
      breakMinutes,
      timeSlotsCount: timeSlots.length,
    });
    throw error;
  }
}

