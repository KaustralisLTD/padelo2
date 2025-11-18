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
    
    // Фильтруем только Play Off группы (quarterfinals, semifinals, finals)
    const playoffGroups = allGroups.filter((g: any) => {
      const name = g.group_name.toLowerCase();
      return name.includes('quarterfinal') || name.includes('semifinal') || name.includes('final') || name.includes('match');
    });
    
    console.log(`[generateNextPlayoffStageSchedule] Playoff groups:`, playoffGroups.map((g: any) => ({ id: g.id, name: g.group_name })));
    
    if (playoffGroups.length === 0) {
      console.log(`[generateNextPlayoffStageSchedule] No playoff groups found`);
      return { success: false, matchesGenerated: 0, error: 'No playoff groups found' };
    }
    
    // Определяем текущий этап и следующий
    // Quarterfinals могут называться "Quarterfinal Match X" или просто "Match X" (если это первый playoff stage)
    const quarterfinalGroups = playoffGroups.filter((g: any) => {
      const name = g.group_name.toLowerCase();
      return name.includes('quarterfinal') || 
             (name.includes('match') && !name.includes('semifinal') && !name.includes('final') && !name.includes('quarter'));
    });
    const semifinalGroups = playoffGroups.filter((g: any) => 
      g.group_name.toLowerCase().includes('semifinal')
    );
    const finalGroups = playoffGroups.filter((g: any) => 
      g.group_name.toLowerCase().includes('final') && !g.group_name.toLowerCase().includes('semifinal')
    );
    
    console.log(`[generateNextPlayoffStageSchedule] Quarterfinal groups: ${quarterfinalGroups.length}, Semifinal groups: ${semifinalGroups.length}, Final groups: ${finalGroups.length}`);
    
    // Определяем, какой этап нужно сгенерировать
    let groupsToSchedule: any[] = [];
    let nextStage: string | undefined;
    
    // Сначала проверяем quarterfinals -> semifinals
    if (quarterfinalGroups.length > 0 && semifinalGroups.length === 0 && finalGroups.length === 0) {
      // Есть quarterfinals, но нет semifinals - проверяем завершенность quarterfinals и создаем semifinals
      console.log(`[generateNextPlayoffStageSchedule] Found ${quarterfinalGroups.length} quarterfinal groups, no semifinals found. Checking if quarterfinals are completed...`);
      
      // Проверяем, завершены ли все quarterfinals
      let allQuarterfinalsCompleted = true;
      const winners: number[] = [];
      
      for (const group of quarterfinalGroups) {
        const winner = await getWinnerFromKnockoutMatch(group.id);
        console.log(`[generateNextPlayoffStageSchedule] Quarterfinal group ${group.id} (${group.group_name}): winner = ${winner}`);
        if (winner) {
          winners.push(winner);
        } else {
          allQuarterfinalsCompleted = false;
          console.log(`[generateNextPlayoffStageSchedule] Quarterfinal group ${group.id} (${group.group_name}) is not completed`);
          break;
        }
      }
      
      if (!allQuarterfinalsCompleted) {
        console.log(`[generateNextPlayoffStageSchedule] Not all quarterfinals are completed`);
        return { 
          success: false, 
          matchesGenerated: 0, 
          error: 'Not all quarterfinals are completed' 
        };
      }
      
      console.log(`[generateNextPlayoffStageSchedule] All quarterfinals completed. Winners:`, winners);
      
      // Проверяем, существуют ли уже semifinals
      const [existingSemifinals] = await pool.execute(
        `SELECT id FROM tournament_groups 
         WHERE tournament_id = ? AND category = ? 
         AND group_name LIKE '%Semifinal%'`,
        [tournamentId, category]
      ) as any[];
      
      if (existingSemifinals.length > 0) {
        // Semifinals уже существуют, генерируем расписание для них
        const [semifinalGroupsData] = await pool.execute(
          `SELECT id, group_name FROM tournament_groups 
           WHERE tournament_id = ? AND category = ? 
           AND group_name LIKE '%Semifinal%'`,
          [tournamentId, category]
        ) as any[];
        
        groupsToSchedule = semifinalGroupsData;
        nextStage = 'semifinals';
      } else {
        // Semifinals не существуют - создаем их автоматически
        console.log('[generateNextPlayoffStageSchedule] Semifinals not found, creating them automatically...');
        const advancement = await checkAndAdvanceWinners(tournamentId, category);
        
        if (!advancement.advanced) {
          return { 
            success: false, 
            matchesGenerated: 0, 
            error: advancement.reason || 'Failed to create semifinals stage' 
          };
        }
        
        if (advancement.nextStage !== 'semifinals') {
          return { 
            success: false, 
            matchesGenerated: 0, 
            error: `Expected semifinals stage, but got ${advancement.nextStage}` 
          };
        }
        
        // Получаем созданные группы semifinals
        const [semifinalGroupsData] = await pool.execute(
          `SELECT id, group_name FROM tournament_groups 
           WHERE tournament_id = ? AND category = ? 
           AND group_name LIKE '%Semifinal%'`,
          [tournamentId, category]
        ) as any[];
        
        if (semifinalGroupsData.length === 0) {
          return { 
            success: false, 
            matchesGenerated: 0, 
            error: 'Semifinals stage was created but no groups found' 
          };
        }
        
        groupsToSchedule = semifinalGroupsData;
        nextStage = 'semifinals';
        console.log('[generateNextPlayoffStageSchedule] Semifinals stage created successfully, groups:', semifinalGroupsData.map((g: any) => g.group_name));
      }
    } else if (semifinalGroups.length > 0 && finalGroups.length === 0) {
      // Есть полуфиналы, но нет финалов
      console.log(`[generateNextPlayoffStageSchedule] Found ${semifinalGroups.length} semifinal groups, no finals found.`);
      
      // Сначала проверяем, есть ли у полуфиналов уже расписание
      const semifinalGroupIds = semifinalGroups.map((g: any) => g.id);
      const placeholders = semifinalGroupIds.map(() => '?').join(',');
      const [semifinalMatches] = await pool.execute(
        `SELECT id, group_id, match_date FROM tournament_matches 
         WHERE group_id IN (${placeholders})`,
        semifinalGroupIds
      ) as any[];
      
      const scheduledSemifinals = semifinalMatches.filter((m: any) => m.match_date !== null);
      const unscheduledSemifinals = semifinalMatches.filter((m: any) => m.match_date === null);
      
      console.log(`[generateNextPlayoffStageSchedule] Semifinal matches: ${scheduledSemifinals.length} scheduled, ${unscheduledSemifinals.length} unscheduled`);
      
      // Если есть незапланированные полуфиналы, создаем расписание для них
      if (unscheduledSemifinals.length > 0) {
        console.log(`[generateNextPlayoffStageSchedule] Found ${unscheduledSemifinals.length} unscheduled semifinal matches. Scheduling them...`);
        groupsToSchedule = semifinalGroups;
        nextStage = 'semifinals';
      } else if (scheduledSemifinals.length > 0) {
        // Все полуфиналы запланированы - сначала проверяем, завершены ли они
        // Если завершены, сразу переходим к финалам
        let allSemifinalsCompleted = true;
        for (const group of semifinalGroups) {
          const winner = await getWinnerFromKnockoutMatch(group.id);
          if (!winner) {
            allSemifinalsCompleted = false;
            break;
          }
        }
        
        if (allSemifinalsCompleted) {
          // Полуфиналы завершены - переходим к финалам
          console.log(`[generateNextPlayoffStageSchedule] All semifinals are completed. Proceeding to finals...`);
          
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
        } else {
          // Полуфиналы запланированы, но не завершены
          console.log(`[generateNextPlayoffStageSchedule] Semifinals are scheduled but not completed yet`);
          return { 
            success: false, 
            matchesGenerated: 0, 
            error: 'Not all semifinals are completed. Please wait for semifinals to finish before generating finals schedule.' 
          };
        }
      } else {
        // Нет матчей в полуфиналах вообще
        return { 
          success: false, 
          matchesGenerated: 0, 
          error: 'No matches found in semifinal groups' 
        };
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
    const groupIds = groupsToSchedule.map((g: any) => g.id);
    console.log(`[generateNextPlayoffStageSchedule] Groups to schedule:`, groupsToSchedule.map((g: any) => ({ id: g.id, name: g.group_name })));
    console.log(`[generateNextPlayoffStageSchedule] Group IDs:`, groupIds);
    
    if (groupIds.length === 0) {
      console.log(`[generateNextPlayoffStageSchedule] No groups to schedule`);
      return { 
        success: false, 
        matchesGenerated: 0, 
        error: 'No groups to schedule' 
      };
    }
    
    const placeholders = groupIds.map(() => '?').join(',');
    
    // Сначала проверим, есть ли вообще матчи в этих группах
    const [allMatchesInGroups] = await pool.execute(
      `SELECT id, group_id, pair1_id, pair2_id, match_date
       FROM tournament_matches 
       WHERE group_id IN (${placeholders})
       ORDER BY group_id`,
      groupIds
    ) as any[];
    
    console.log(`[generateNextPlayoffStageSchedule] All matches in groups (${groupIds.length} groups):`, allMatchesInGroups.map((m: any) => ({ 
      id: m.id, 
      groupId: m.group_id, 
      pair1: m.pair1_id, 
      pair2: m.pair2_id,
      matchDate: m.match_date 
    })));
    
    // Фильтруем только те, у которых match_date IS NULL
    const matches = allMatchesInGroups.filter((m: any) => m.match_date === null);
    const alreadyScheduledMatches = allMatchesInGroups.filter((m: any) => m.match_date !== null);
    
    console.log(`[generateNextPlayoffStageSchedule] Found ${matches.length} unscheduled matches (out of ${allMatchesInGroups.length} total):`, matches.map((m: any) => ({ id: m.id, groupId: m.group_id, pair1: m.pair1_id, pair2: m.pair2_id })));
    
    // Если все матчи уже запланированы, проверяем, не пытаемся ли мы создать расписание для уже запланированного этапа
    if (matches.length === 0 && alreadyScheduledMatches.length > 0) {
      console.log(`[generateNextPlayoffStageSchedule] All matches are already scheduled. Checking if we should proceed to next stage...`);
      
      // Определяем название этапа из групп
      const stageName = groupsToSchedule[0]?.group_name || 'this stage';
      const isQuarterfinal = stageName.toLowerCase().includes('quarterfinal') || 
                            (stageName.toLowerCase().includes('match') && !stageName.toLowerCase().includes('semifinal') && !stageName.toLowerCase().includes('final'));
      const isSemifinal = stageName.toLowerCase().includes('semifinal');
      const isFinal = stageName.toLowerCase().includes('final') && !stageName.toLowerCase().includes('semifinal');
      
      if (isQuarterfinal) {
        // Quarterfinals уже запланированы - проверяем, завершены ли они, чтобы перейти к semifinals
        console.log(`[generateNextPlayoffStageSchedule] Quarterfinals are scheduled. Checking if they are completed to proceed to semifinals...`);
        
        let allCompleted = true;
        for (const group of groupsToSchedule) {
          const winner = await getWinnerFromKnockoutMatch(group.id);
          if (!winner) {
            allCompleted = false;
            break;
          }
        }
        
        if (!allCompleted) {
          return {
            success: false,
            matchesGenerated: 0,
            error: `Schedule for ${stageName} already exists. Please wait for quarterfinals to complete before generating semifinals schedule.`
          };
        } else {
          // Quarterfinals завершены - нужно перейти к semifinals
          // Это означает, что логика выше должна была это обработать, но по какой-то причине не сработала
          // Попробуем создать semifinals
          console.log(`[generateNextPlayoffStageSchedule] All quarterfinals completed. Attempting to create semifinals...`);
          
          const advancement = await checkAndAdvanceWinners(tournamentId, category);
          if (!advancement.advanced || advancement.nextStage !== 'semifinals') {
            return {
              success: false,
              matchesGenerated: 0,
              error: advancement.reason || 'Failed to create semifinals stage. Please try again.'
            };
          }
          
          // Получаем созданные группы semifinals
          const [semifinalGroupsData] = await pool.execute(
            `SELECT id, group_name FROM tournament_groups 
             WHERE tournament_id = ? AND category = ? 
             AND group_name LIKE '%Semifinal%'`,
            [tournamentId, category]
          ) as any[];
          
          if (semifinalGroupsData.length === 0) {
            return {
              success: false,
              matchesGenerated: 0,
              error: 'Semifinals stage was created but no groups found. Please refresh and try again.'
            };
          }
          
          // Обновляем groupsToSchedule для semifinals
          groupsToSchedule = semifinalGroupsData;
          nextStage = 'semifinals';
          
          // Продолжаем выполнение - создадим расписание для semifinals
          console.log(`[generateNextPlayoffStageSchedule] Semifinals created, proceeding to schedule generation...`);
        }
      } else if (isSemifinal) {
        // Это не должно происходить, так как логика выше уже обработала этот случай
        // Но оставляем как защиту
        return {
          success: false,
          matchesGenerated: 0,
          error: `Schedule for ${stageName} already exists. If semifinals are completed, please use the button again to generate finals schedule.`
        };
      } else if (isFinal) {
        return {
          success: false,
          matchesGenerated: 0,
          error: `Schedule for ${stageName} already exists.`
        };
      } else {
        return {
          success: false,
          matchesGenerated: 0,
          error: `Schedule for ${stageName} already exists.`
        };
      }
    }
    
    if (matches.length === 0) {
      // Если матчей нет вообще, возможно они не были созданы - создаем их
      console.log(`[generateNextPlayoffStageSchedule] No unscheduled matches found. Checking if matches need to be created...`);
      
      // Проверяем, есть ли пары в группах
      for (const group of groupsToSchedule) {
        const [pairs] = await pool.execute(
          'SELECT id FROM tournament_group_pairs WHERE group_id = ? AND player1_registration_id IS NOT NULL',
          [group.id]
        ) as any[];
        
        console.log(`[generateNextPlayoffStageSchedule] Group ${group.id} (${group.group_name}): ${pairs.length} pairs with players`);
        
        if (pairs.length >= 2 && allMatchesInGroups.filter((m: any) => m.group_id === group.id).length === 0) {
          // Создаем матч для этой группы
          console.log(`[generateNextPlayoffStageSchedule] Creating match for group ${group.id}...`);
          try {
            const { createMissingMatchesForGroup } = await import('./matches');
            const result = await createMissingMatchesForGroup(group.id);
            console.log(`[generateNextPlayoffStageSchedule] Created ${result.created} matches for group ${group.id}`);
          } catch (error) {
            console.error(`[generateNextPlayoffStageSchedule] Error creating matches for group ${group.id}:`, error);
          }
        }
      }
      
      // Перепроверяем после создания
      const [matchesAfterCreate] = await pool.execute(
        `SELECT id, group_id, pair1_id, pair2_id 
         FROM tournament_matches 
         WHERE group_id IN (${placeholders}) 
         AND match_date IS NULL
         ORDER BY group_id`,
        groupIds
      ) as any[];
      
      if (matchesAfterCreate.length === 0) {
        console.log(`[generateNextPlayoffStageSchedule] Still no unscheduled matches found after creating matches`);
        return { 
          success: false, 
          matchesGenerated: 0, 
          error: 'No unscheduled matches found for next stage. Matches may already be scheduled or groups may not have enough pairs.' 
        };
      }
      
      // Используем созданные матчи
      matches.length = 0; // Очищаем массив
      matches.push(...matchesAfterCreate);
    }
    
    if (matches.length === 0) {
      console.log(`[generateNextPlayoffStageSchedule] No matches to schedule after all checks`);
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
    // Используем JOIN с tournament_groups для получения tournament_id
    const [occupiedCourts] = await pool.execute(
      `SELECT tm.court_number, MAX(tm.match_date) as last_match_time
       FROM tournament_matches tm
       JOIN tournament_groups tg ON tm.group_id = tg.id
       WHERE tg.tournament_id = ?
       AND tm.match_date >= ?
       AND tm.match_date < DATE_ADD(?, INTERVAL 2 HOUR)
       AND tm.court_number IS NOT NULL
       GROUP BY tm.court_number
       ORDER BY last_match_time DESC`,
      [tournamentId, startTime, startTime]
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
    
    // Определяем количество кортов для распределения
    const courtsToUse = availableCourtNumbers.length > 0 ? availableCourtNumbers.length : availableCourts;
    
    for (const match of matches) {
      // Определяем корт - распределяем параллельно по всем доступным кортам
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
        matchOrder: courtIndex + 1,
      });
      
      // Переходим к следующему корту
      courtIndex++;
      
      // Если все корты в текущем временном слоте использованы, переходим к следующему временному слоту
      // Это позволяет распределять матчи параллельно на одно время
      if (courtIndex % courtsToUse === 0) {
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

