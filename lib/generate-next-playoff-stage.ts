/**
 * Генерация расписания для следующего этапа Play Off
 * Автоматически определяет время на основе текущего времени и свободных кортов
 * Автоматически создает следующий этап, если он еще не создан
 */
import { getDbPool } from './db';
import { saveSchedule, MatchSchedule } from './schedule';
import { getWinnerFromKnockoutMatch, checkAndAdvanceWinners } from './knockout';

export async function generateNextPlayoffStageSchedule(
  tournamentId: number,
  category: string,
  availableCourts: number = 3,
  matchDurationMinutes: number = 45,
  breakMinutes: number = 15
): Promise<{ success: boolean; matchesGenerated: number; nextStage?: string; error?: string }> {
  try {
    console.log(`[generateNextPlayoffStageSchedule] Starting for tournament ${tournamentId}, category: ${category}`);
    const pool = getDbPool();
    
    // Получаем все группы Play Off для этой категории
    const [allGroups] = await pool.execute(
      `SELECT id, group_name, group_number FROM tournament_groups 
       WHERE tournament_id = ? AND category = ? 
       ORDER BY group_number`,
      [tournamentId, category]
    ) as any[];
    
    console.log(`[generateNextPlayoffStageSchedule] All groups found:`, allGroups.map((g: any) => ({ id: g.id, name: g.group_name })));
    
    // Фильтруем только Play Off группы (semifinals, finals)
    const playoffGroups = allGroups.filter((g: any) => {
      const name = g.group_name.toLowerCase();
      return name.includes('semifinal') || name.includes('final') || name.includes('match');
    });
    
    console.log(`[generateNextPlayoffStageSchedule] Playoff groups:`, playoffGroups.map((g: any) => ({ id: g.id, name: g.group_name })));
    
    if (playoffGroups.length === 0) {
      console.log(`[generateNextPlayoffStageSchedule] No playoff groups found`);
      return { success: false, matchesGenerated: 0, error: 'No playoff groups found' };
    }
    
    // Определяем текущий этап и следующий
    const semifinalGroups = playoffGroups.filter((g: any) => 
      g.group_name.toLowerCase().includes('semifinal')
    );
    const finalGroups = playoffGroups.filter((g: any) => 
      g.group_name.toLowerCase().includes('final') && !g.group_name.toLowerCase().includes('semifinal')
    );
    
    console.log(`[generateNextPlayoffStageSchedule] Semifinal groups: ${semifinalGroups.length}, Final groups: ${finalGroups.length}`);
    
    // Определяем, какой этап нужно сгенерировать
    let groupsToSchedule: any[] = [];
    let nextStage: string | undefined;
    
    if (semifinalGroups.length > 0 && finalGroups.length === 0) {
      // Есть полуфиналы, но нет финалов - генерируем финалы
      console.log(`[generateNextPlayoffStageSchedule] Found ${semifinalGroups.length} semifinal groups, no finals found. Checking if semifinals are completed...`);
      
      // Проверяем, завершены ли все полуфиналы
      let allSemifinalsCompleted = true;
      const winners: number[] = [];
      
      for (const group of semifinalGroups) {
        const winner = await getWinnerFromKnockoutMatch(group.id);
        console.log(`[generateNextPlayoffStageSchedule] Semifinal group ${group.id} (${group.group_name}): winner = ${winner}`);
        if (winner) {
          winners.push(winner);
        } else {
          allSemifinalsCompleted = false;
          console.log(`[generateNextPlayoffStageSchedule] Semifinal group ${group.id} (${group.group_name}) is not completed`);
          break;
        }
      }
      
      if (!allSemifinalsCompleted) {
        console.log(`[generateNextPlayoffStageSchedule] Not all semifinals are completed`);
        return { 
          success: false, 
          matchesGenerated: 0, 
          error: 'Not all semifinals are completed' 
        };
      }
      
      console.log(`[generateNextPlayoffStageSchedule] All semifinals completed. Winners:`, winners);
      
      // Проверяем, существуют ли уже финалы
      const [existingFinals] = await pool.execute(
        `SELECT id FROM tournament_groups 
         WHERE tournament_id = ? AND category = ? 
         AND group_name LIKE '%Final%' 
         AND group_name NOT LIKE '%Semifinal%'`,
        [tournamentId, category]
      ) as any[];
      
      if (existingFinals.length > 0) {
        // Финалы уже существуют, генерируем расписание для них
        const [finalGroupsData] = await pool.execute(
          `SELECT id, group_name FROM tournament_groups 
           WHERE tournament_id = ? AND category = ? 
           AND group_name LIKE '%Final%' 
           AND group_name NOT LIKE '%Semifinal%'`,
          [tournamentId, category]
        ) as any[];
        
        groupsToSchedule = finalGroupsData;
        nextStage = 'finals';
      } else {
        // Финалы не существуют - создаем их автоматически
        console.log('[generateNextPlayoffStageSchedule] Finals not found, creating them automatically...');
        const advancement = await checkAndAdvanceWinners(tournamentId, category);
        
        if (!advancement.advanced) {
          return { 
            success: false, 
            matchesGenerated: 0, 
            error: advancement.reason || 'Failed to create finals stage' 
          };
        }
        
        if (advancement.nextStage !== 'finals') {
          return { 
            success: false, 
            matchesGenerated: 0, 
            error: `Expected finals stage, but got ${advancement.nextStage}` 
          };
        }
        
        // Получаем созданные группы финалов
        const [finalGroupsData] = await pool.execute(
          `SELECT id, group_name FROM tournament_groups 
           WHERE tournament_id = ? AND category = ? 
           AND group_name LIKE '%Final%' 
           AND group_name NOT LIKE '%Semifinal%'`,
          [tournamentId, category]
        ) as any[];
        
        if (finalGroupsData.length === 0) {
          return { 
            success: false, 
            matchesGenerated: 0, 
            error: 'Finals stage was created but no groups found' 
          };
        }
        
        groupsToSchedule = finalGroupsData;
        nextStage = 'finals';
        console.log('[generateNextPlayoffStageSchedule] Finals stage created successfully, groups:', finalGroupsData.map((g: any) => g.group_name));
      }
    } else if (finalGroups.length > 0) {
      // Финалы уже есть - генерируем расписание для них
      groupsToSchedule = finalGroups;
      nextStage = 'finals';
    } else {
      return { 
        success: false, 
        matchesGenerated: 0, 
        error: 'Cannot determine next stage to schedule' 
      };
    }
    
    // Получаем матчи для этих групп (только те, у которых match_date IS NULL)
    const groupIds = groupsToSchedule.map(g => g.id);
    console.log(`[generateNextPlayoffStageSchedule] Groups to schedule:`, groupsToSchedule.map((g: any) => ({ id: g.id, name: g.group_name })));
    console.log(`[generateNextPlayoffStageSchedule] Group IDs:`, groupIds);
    
    const placeholders = groupIds.map(() => '?').join(',');
    
    const [matches] = await pool.execute(
      `SELECT id, group_id, pair1_id, pair2_id 
       FROM tournament_matches 
       WHERE group_id IN (${placeholders}) 
       AND match_date IS NULL
       ORDER BY group_id`,
      groupIds
    ) as any[];
    
    console.log(`[generateNextPlayoffStageSchedule] Found ${matches.length} unscheduled matches:`, matches.map((m: any) => ({ id: m.id, groupId: m.group_id, pair1: m.pair1_id, pair2: m.pair2_id })));
    
    if (matches.length === 0) {
      console.log(`[generateNextPlayoffStageSchedule] No unscheduled matches found for next stage`);
      return { 
        success: false, 
        matchesGenerated: 0, 
        error: 'No unscheduled matches found for next stage' 
      };
    }
    
    // Определяем текущее время и ближайшее доступное время
    const now = new Date();
    // Округляем до ближайших 15 минут
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    const startTime = new Date(now);
    startTime.setMinutes(roundedMinutes);
    startTime.setSeconds(0);
    startTime.setMilliseconds(0);
    
    // Если время меньше текущего, добавляем 15 минут
    if (startTime <= now) {
      startTime.setMinutes(startTime.getMinutes() + 15);
    }
    
    // Получаем занятые корты на ближайшее время
    const [occupiedCourts] = await pool.execute(
      `SELECT court_number, MAX(match_date) as last_match_time
       FROM tournament_matches 
       WHERE tournament_id = (SELECT tournament_id FROM tournament_groups WHERE id = ? LIMIT 1)
       AND match_date >= ?
       AND match_date < DATE_ADD(?, INTERVAL 2 HOUR)
       AND court_number IS NOT NULL
       GROUP BY court_number
       ORDER BY last_match_time DESC`,
      [groupIds[0], startTime, startTime]
    ) as any[];
    
    // Определяем свободные корты
    const occupiedCourtNumbers = new Set(occupiedCourts.map((c: any) => c.court_number));
    const availableCourtNumbers: number[] = [];
    for (let i = 1; i <= availableCourts; i++) {
      if (!occupiedCourtNumbers.has(i)) {
        availableCourtNumbers.push(i);
      }
    }
    
    // Если все корты заняты, находим время когда освободится первый корт
    let currentTime = new Date(startTime);
    if (availableCourtNumbers.length === 0 && occupiedCourts.length > 0) {
      const lastMatchTime = new Date(occupiedCourts[0].last_match_time);
      currentTime = new Date(lastMatchTime.getTime() + (matchDurationMinutes + breakMinutes) * 60000);
    }
    
    // Генерируем расписание для матчей
    console.log(`[generateNextPlayoffStageSchedule] Generating schedule for ${matches.length} matches`);
    console.log(`[generateNextPlayoffStageSchedule] Start time: ${currentTime.toISOString()}, Available courts: ${availableCourtNumbers.length > 0 ? availableCourtNumbers.join(', ') : 'all'}`);
    
    const scheduledMatches: MatchSchedule[] = [];
    let courtIndex = 0;
    let matchTime = new Date(currentTime);
    
    for (const match of matches) {
      // Определяем корт
      const courtNumber = availableCourtNumbers.length > 0 
        ? availableCourtNumbers[courtIndex % availableCourtNumbers.length]
        : ((courtIndex % availableCourts) + 1);
      
      console.log(`[generateNextPlayoffStageSchedule] Scheduling match ${match.id} (group ${match.group_id}, pair1: ${match.pair1_id} vs pair2: ${match.pair2_id}) at ${matchTime.toISOString()}, court ${courtNumber}`);
      
      scheduledMatches.push({
        groupId: match.group_id,
        pair1Id: match.pair1_id,
        pair2Id: match.pair2_id,
        matchDate: new Date(matchTime),
        courtNumber,
      });
      
      // Переходим к следующему корту
      courtIndex++;
      
      // Если все корты использованы, переходим к следующему временному слоту
      if (courtIndex % availableCourts === 0) {
        matchTime = new Date(matchTime.getTime() + (matchDurationMinutes + breakMinutes) * 60000);
      }
    }
    
    // Сохраняем расписание
    console.log(`[generateNextPlayoffStageSchedule] Saving ${scheduledMatches.length} matches to schedule`);
    console.log(`[generateNextPlayoffStageSchedule] Scheduled matches:`, scheduledMatches.map(m => ({
      groupId: m.groupId,
      pair1Id: m.pair1Id,
      pair2Id: m.pair2Id,
      matchDate: m.matchDate,
      courtNumber: m.courtNumber
    })));
    await saveSchedule(scheduledMatches);
    
    console.log(`[generateNextPlayoffStageSchedule] Successfully generated schedule for ${nextStage} stage. Matches: ${scheduledMatches.length}`);
    
    return {
      success: true,
      matchesGenerated: scheduledMatches.length,
      nextStage,
    };
  } catch (error: any) {
    console.error('[generateNextPlayoffStageSchedule] Error:', error);
    console.error('[generateNextPlayoffStageSchedule] Error stack:', error.stack);
    return {
      success: false,
      matchesGenerated: 0,
      error: error.message || 'Failed to generate schedule',
    };
  }
}

