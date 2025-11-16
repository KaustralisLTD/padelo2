// Knockout stage management (quarterfinals, semifinals, finals)
import { getDbPool } from './db';
import { getGroupStandings } from './matches';
import { getTournamentGroups, createTournamentGroup } from './tournaments';

const useDatabase = !!(
  process.env.DATABASE_HOST &&
  process.env.DATABASE_USER &&
  process.env.DATABASE_PASSWORD &&
  process.env.DATABASE_NAME
);

/**
 * Check if all matches in a group are completed
 */
export async function isGroupCompleted(groupId: number): Promise<boolean> {
  if (!useDatabase) return false;
  
  try {
    const pool = getDbPool();
    
    // Get all pairs in the group
    const [pairs] = await pool.execute(
      'SELECT id FROM tournament_group_pairs WHERE group_id = ?',
      [groupId]
    ) as any[];
    
    if (pairs.length < 2) {
      console.log(`[isGroupCompleted] Group ${groupId}: Less than 2 pairs (${pairs.length})`);
      return false;
    }
    
    // Calculate expected number of matches (round-robin: n*(n-1)/2)
    const expectedMatches = (pairs.length * (pairs.length - 1)) / 2;
    
    // Get total matches created for this group
    const [totalMatches] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM tournament_matches 
       WHERE group_id = ?`,
      [groupId]
    ) as any[];
    
    const totalMatchesCount = totalMatches[0].count;
    
    // Get completed matches (with results)
    // Проверяем либо games (для обычных матчей), либо sets (для knockout-матчей)
    // Важно: проверяем, что оба значения не NULL (не просто заполнены, а именно не NULL)
    const [matches] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM tournament_matches 
       WHERE group_id = ? 
       AND (
         (pair1_games IS NOT NULL AND pair2_games IS NOT NULL AND pair1_games >= 0 AND pair2_games >= 0) OR
         (pair1_set1 IS NOT NULL AND pair1_set2 IS NOT NULL AND pair2_set1 IS NOT NULL AND pair2_set2 IS NOT NULL
          AND pair1_set1 >= 0 AND pair1_set2 >= 0 AND pair2_set1 >= 0 AND pair2_set2 >= 0)
       )`,
      [groupId]
    ) as any[];
    
    const completedCount = matches[0].count;
    
    console.log(`[isGroupCompleted] Group ${groupId}: ${completedCount}/${expectedMatches} matches completed (total created: ${totalMatchesCount}), pairs: ${pairs.length}`);
    
    // Дополнительная проверка: если создано меньше матчей, чем ожидается, группа не завершена
    if (totalMatchesCount < expectedMatches) {
      console.log(`[isGroupCompleted] Group ${groupId}: Not all matches created. Expected: ${expectedMatches}, Created: ${totalMatchesCount}`);
      return false;
    }
    
    if (completedCount < expectedMatches) {
      console.log(`[isGroupCompleted] Group ${groupId}: Not all matches have results. Completed: ${completedCount}, Expected: ${expectedMatches}`);
      // Дополнительная диагностика: проверим, какие матчи не завершены
      const [incompleteMatches] = await pool.execute(
        `SELECT id, pair1_id, pair2_id, pair1_games, pair2_games, 
                pair1_set1, pair1_set2, pair2_set1, pair2_set2
         FROM tournament_matches 
         WHERE group_id = ? 
         AND NOT (
           (pair1_games IS NOT NULL AND pair2_games IS NOT NULL AND pair1_games >= 0 AND pair2_games >= 0) OR
           (pair1_set1 IS NOT NULL AND pair1_set2 IS NOT NULL AND pair2_set1 IS NOT NULL AND pair2_set2 IS NOT NULL
            AND pair1_set1 >= 0 AND pair1_set2 >= 0 AND pair2_set1 >= 0 AND pair2_set2 >= 0)
         )`,
        [groupId]
      ) as any[];
      console.log(`[isGroupCompleted] Group ${groupId}: Incomplete matches:`, JSON.stringify(incompleteMatches, null, 2));
      
      // Также проверим все матчи группы для полной диагностики
      const [allMatches] = await pool.execute(
        `SELECT id, pair1_id, pair2_id, pair1_games, pair2_games, 
                pair1_set1, pair1_set2, pair2_set1, pair2_set2
         FROM tournament_matches 
         WHERE group_id = ?`,
        [groupId]
      ) as any[];
      console.log(`[isGroupCompleted] Group ${groupId}: All matches in group:`, JSON.stringify(allMatches, null, 2));
      return false;
    }
    
    console.log(`[isGroupCompleted] Group ${groupId}: ✅ COMPLETED - All ${expectedMatches} matches have results`);
    return true;
  } catch (error: any) {
    console.error(`[isGroupCompleted] Error checking group ${groupId} completion:`, error);
    console.error(`[isGroupCompleted] Error stack:`, error.stack);
    return false;
  }
}

/**
 * Get top N pairs from a group based on standings
 * Returns pair IDs (tournament_group_pairs.id)
 */
export async function getTopPairsFromGroup(
  groupId: number,
  topN: number = 2
): Promise<number[]> {
  const standings = await getGroupStandings(groupId);
  return standings.slice(0, topN).map(s => s.pairId);
}

/**
 * Get winner from a knockout stage match (group with only 1 match)
 * Returns the pair ID of the winner, or null if match not completed
 */
export async function getWinnerFromKnockoutMatch(groupId: number): Promise<number | null> {
  if (!useDatabase) return null;
  
  try {
    const pool = getDbPool();
    
    // Get the match for this group
    const [matches] = await pool.execute(
      `SELECT pair1_id, pair2_id, pair1_games, pair2_games, winner_pair_id,
              pair1_set1, pair1_set2, pair1_set3, pair2_set1, pair2_set2, pair2_set3
       FROM tournament_matches 
       WHERE group_id = ? 
       AND (
         (pair1_games IS NOT NULL AND pair2_games IS NOT NULL) OR
         (pair1_set1 IS NOT NULL AND pair1_set2 IS NOT NULL AND pair2_set1 IS NOT NULL AND pair2_set2 IS NOT NULL)
       )
       LIMIT 1`,
      [groupId]
    ) as any[];
    
    if (matches.length === 0) {
      console.log(`[getWinnerFromKnockoutMatch] Group ${groupId}: No completed match found`);
      return null;
    }
    
    const match = matches[0];
    
    // Если есть sets (knockout match), определяем победителя по sets
    if (match.pair1_set1 !== null && match.pair1_set2 !== null && 
        match.pair2_set1 !== null && match.pair2_set2 !== null) {
      let pair1Sets = 0, pair2Sets = 0;
      
      if (match.pair1_set1 > match.pair2_set1) pair1Sets++;
      else if (match.pair2_set1 > match.pair1_set1) pair2Sets++;
      
      if (match.pair1_set2 > match.pair2_set2) pair1Sets++;
      else if (match.pair2_set2 > match.pair1_set2) pair2Sets++;
      
      // Если 1:1 по sets, проверяем set 3
      if (pair1Sets === 1 && pair2Sets === 1) {
        if (match.pair1_set3 !== null && match.pair2_set3 !== null) {
          if (match.pair1_set3 > match.pair2_set3) {
            return match.pair1_id;
          } else if (match.pair2_set3 > match.pair1_set3) {
            return match.pair2_id;
          }
        }
      } else {
        // Победитель определен по первым двум sets
        return pair1Sets > pair2Sets ? match.pair1_id : match.pair2_id;
      }
    }
    
    // Fallback: определяем победителя по games (для совместимости)
    if (match.pair1_games > match.pair2_games) {
      return match.pair1_id;
    } else if (match.pair2_games > match.pair1_games) {
      return match.pair2_id;
    } else {
      // Draw - use winner_pair_id if available
      return match.winner_pair_id;
    }
  } catch (error: any) {
    console.error(`[getWinnerFromKnockoutMatch] Error getting winner from group ${groupId}:`, error);
    return null;
  }
}

/**
 * Create knockout stage matches (playoff)
 * Логика: 1-е место группы A играет с 2-м местом группы B, 1-е место группы B играет с 2-м местом группы A
 * qualifiedPairs должен содержать пары в порядке: [Group1_1st, Group1_2nd, Group2_1st, Group2_2nd, ...]
 */
export async function createKnockoutStage(
  tournamentId: number,
  category: string,
  stage: 'quarterfinals' | 'semifinals' | 'finals',
  qualifiedPairs: number[]
): Promise<number[]> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  const pool = getDbPool();
  
  // Количество матчей = количество пар / 2
  const numberOfMatches = Math.floor(qualifiedPairs.length / 2);
  
  if (numberOfMatches === 0) {
    throw new Error('Not enough qualified pairs for knockout stage');
  }
  
  const createdGroupIds: number[] = [];
  
  // Find the maximum group_number for this category to avoid conflicts
  const [maxGroupResult] = await pool.execute(
    `SELECT MAX(group_number) as max_number 
     FROM tournament_groups 
     WHERE tournament_id = ? AND category = ?`,
    [tournamentId, category]
  ) as any[];
  
  const maxGroupNumber = maxGroupResult[0]?.max_number || 0;
  const startGroupNumber = maxGroupNumber + 1;
  
  console.log(`[createKnockoutStage] Tournament ${tournamentId}, Category: ${category}, Stage: ${stage}`);
  console.log(`[createKnockoutStage] Qualified pairs: ${qualifiedPairs.length}, Matches to create: ${numberOfMatches}`);
  console.log(`[createKnockoutStage] Max group number: ${maxGroupNumber}, Starting from: ${startGroupNumber}`);
  
  // Создаем группы для knockout stage (по одной группе на матч)
  // Каждая группа содержит 2 пары, между которыми будет матч
  for (let i = 1; i <= numberOfMatches; i++) {
    const groupNumber = startGroupNumber + i - 1;
    
    // Создаем группу для этого матча
    const group = await createTournamentGroup({
      tournamentId,
      category,
      groupName: `${stage.charAt(0).toUpperCase() + stage.slice(1)} Match ${i}`,
      groupNumber: groupNumber,
      maxPairs: 2,
    });
    
    createdGroupIds.push(group.id);
    
    // Определяем пары для этого матча
    // qualifiedPairs приходит в порядке: [Group1_1st, Group1_2nd, Group2_1st, Group2_2nd, Group3_1st, Group3_2nd, ...]
    // Логика матчей:
    // - Для каждой пары групп (Group i и Group i+1) создаем 2 матча:
    //   Match 1: Group i, 1st place vs Group i+1, 2nd place
    //   Match 2: Group i+1, 1st place vs Group i, 2nd place
    // 
    // Пример для 4 групп (8 пар):
    // Match 1: G1_1st (index 0) vs G2_2nd (index 3)
    // Match 2: G2_1st (index 2) vs G1_2nd (index 1)
    // Match 3: G3_1st (index 4) vs G4_2nd (index 7)
    // Match 4: G4_1st (index 6) vs G3_2nd (index 5)
    
    const groupsCount = qualifiedPairs.length / 2; // Количество групп
    const pairOfGroups = Math.floor((i - 1) / 2); // Номер пары групп (0, 0, 1, 1, 2, 2, ...)
    const isFirstMatch = (i - 1) % 2 === 0; // Первый матч пары групп или второй
    
    let pair1Index: number;
    let pair2Index: number;
    
    if (isFirstMatch) {
      // Первый матч: 1-е место группы pairOfGroups vs 2-е место группы pairOfGroups + 1
      pair1Index = pairOfGroups * 2; // 1-е место группы pairOfGroups (индекс 0, 4, 8, ...)
      pair2Index = (pairOfGroups + 1) * 2 + 1; // 2-е место группы pairOfGroups + 1 (индекс 3, 7, 11, ...)
    } else {
      // Второй матч: 1-е место группы pairOfGroups + 1 vs 2-е место группы pairOfGroups
      pair1Index = (pairOfGroups + 1) * 2; // 1-е место группы pairOfGroups + 1 (индекс 2, 6, 10, ...)
      pair2Index = pairOfGroups * 2 + 1; // 2-е место группы pairOfGroups (индекс 1, 5, 9, ...)
    }
    
    // Проверяем границы
    if (pair1Index >= qualifiedPairs.length || pair2Index >= qualifiedPairs.length || pair1Index < 0 || pair2Index < 0) {
      console.error(`[createKnockoutStage] Invalid pair indices for match ${i}: pair1Index=${pair1Index}, pair2Index=${pair2Index}, totalPairs=${qualifiedPairs.length}, groupsCount=${groupsCount}`);
      throw new Error(`Invalid pair indices for match ${i}`);
    }
    
    const pair1Id = qualifiedPairs[pair1Index];
    const pair2Id = qualifiedPairs[pair2Index];
    
    console.log(`[createKnockoutStage] Match ${i}: pair1Index=${pair1Index} (pairId=${pair1Id}) vs pair2Index=${pair2Index} (pairId=${pair2Id})`);
      
    // Получаем данные пар
    const [pair1Data] = await pool.execute(
      `SELECT player1_registration_id, player2_registration_id, 
              partner1_registration_id, partner2_registration_id
       FROM tournament_group_pairs WHERE id = ?`,
      [pair1Id]
    ) as any[];
    
    const [pair2Data] = await pool.execute(
        `SELECT player1_registration_id, player2_registration_id, 
                partner1_registration_id, partner2_registration_id
         FROM tournament_group_pairs WHERE id = ?`,
      [pair2Id]
      ) as any[];
      
    if (pair1Data.length > 0 && pair2Data.length > 0) {
      const pair1 = pair1Data[0];
      const pair2 = pair2Data[0];
      
      // Создаем пары в новой группе (knockout match group)
      const [pair1Result] = await pool.execute(
        `INSERT INTO tournament_group_pairs 
         (group_id, pair_number, player1_registration_id, player2_registration_id, 
          partner1_registration_id, partner2_registration_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          group.id,
          1,
          pair1.player1_registration_id,
          pair1.player2_registration_id,
          pair1.partner1_registration_id,
          pair1.partner2_registration_id,
        ]
      ) as any;
      
      const newPair1Id = pair1Result.insertId;
      
      const [pair2Result] = await pool.execute(
          `INSERT INTO tournament_group_pairs 
           (group_id, pair_number, player1_registration_id, player2_registration_id, 
            partner1_registration_id, partner2_registration_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            group.id,
          2,
          pair2.player1_registration_id,
          pair2.player2_registration_id,
          pair2.partner1_registration_id,
          pair2.partner2_registration_id,
          ]
      ) as any;
      
      const newPair2Id = pair2Result.insertId;
      
      // Создаем матч между новыми парами в этой группе
      // match_date устанавливается в NULL, чтобы потом можно было сгенерировать расписание
      await pool.execute(
        `INSERT INTO tournament_matches 
         (group_id, pair1_id, pair2_id, match_date, created_at)
         VALUES (?, ?, ?, NULL, NOW())`,
        [group.id, newPair1Id, newPair2Id]
      );
      
      console.log(`[createKnockoutStage] Created match ${i} in group ${group.id} between new pairs ${newPair1Id} (from ${pair1Id}) and ${newPair2Id} (from ${pair2Id})`);
    } else {
      console.error(`[createKnockoutStage] Failed to get pair data for match ${i}`);
      throw new Error(`Failed to get pair data for match ${i}`);
    }
  }
  
  return createdGroupIds;
}

/**
 * Check all groups in a category and advance winners to next stage if groups are completed
 */
export async function checkAndAdvanceWinners(
  tournamentId: number,
  category: string
): Promise<{ advanced: boolean; nextStage?: string; groupIds?: number[]; reason?: string }> {
  if (!useDatabase) {
    return { advanced: false, reason: 'Database not configured' };
  }
  
  try {
    const pool = getDbPool();
    
    // Get all groups for this category
    const [allGroups] = await pool.execute(
      `SELECT id, group_name, group_number FROM tournament_groups 
       WHERE tournament_id = ? AND category = ? 
       ORDER BY group_number`,
      [tournamentId, category]
    ) as any[];
    
    console.log(`[Knockout] Tournament ${tournamentId}, Category: ${category}, All groups:`, allGroups.map((g: any) => ({ id: g.id, name: g.group_name })));
    
    if (allGroups.length === 0) {
      console.log(`[Knockout] No groups found for tournament ${tournamentId}, category ${category}`);
      return { advanced: false, reason: 'No groups found' };
    }
    
    // Filter to get only regular groups (not knockout stages)
    // Check for common knockout stage patterns in group names
    const groups = allGroups.filter((g: any) => {
      const name = g.group_name.toLowerCase();
      const isKnockout = name.includes('quarterfinal') || 
                        name.includes('semifinal') || 
                        name.includes('final') ||
                        name.includes('quarter') ||
                        name.includes('semi') ||
                        name.startsWith('final') ||
                        name.startsWith('quarter') ||
                        name.startsWith('semi');
      return !isKnockout;
    });
    
    console.log(`[Knockout] Regular groups (after filtering):`, groups.map((g: any) => ({ id: g.id, name: g.group_name })));
    
    if (groups.length === 0) {
      // All groups are knockout stages, check if we can advance from knockout to next knockout
      const knockoutGroups = allGroups.filter((g: any) => {
        const name = g.group_name.toLowerCase();
        return name.includes('quarterfinal') || name.includes('semifinal');
      });
      
      if (knockoutGroups.length > 0) {
        // We have quarterfinals or semifinals, can advance to next stage
        console.log(`[Knockout] All groups are knockout stages, checking if can advance from knockout`);
        // Continue with knockout logic below
      } else {
        console.log(`[Knockout] All groups are finals or no regular groups found`);
        return { advanced: false, reason: 'All groups are knockout stages or finals' };
      }
    }
    
    // Determine next stage based on number of regular groups
    let nextStage: 'quarterfinals' | 'semifinals' | 'finals' | null = null;
    let pairsToAdvance = 2; // Default: top 2 from each group
    
    const totalGroups = groups.length;
    if (totalGroups > 2) {
      nextStage = 'quarterfinals';
    } else if (totalGroups === 2) {
      nextStage = 'semifinals';
    } else if (totalGroups === 1) {
      // Only 1 group - go directly to finals
      nextStage = 'finals';
      pairsToAdvance = 2; // Top 2 from the single group
    } else {
      // No regular groups, check if we can advance from existing knockout stages
      const quarterfinalGroups = allGroups.filter((g: any) => g.group_name.toLowerCase().includes('quarterfinal'));
      const semifinalGroups = allGroups.filter((g: any) => g.group_name.toLowerCase().includes('semifinal'));
      const finalGroups = allGroups.filter((g: any) => {
        const name = g.group_name.toLowerCase();
        return (name.includes('final') && !name.includes('semifinal') && !name.includes('quarterfinal'));
      });
      
      console.log(`[Knockout] Knockout groups found: quarterfinals=${quarterfinalGroups.length}, semifinals=${semifinalGroups.length}, finals=${finalGroups.length}`);
      
      if (quarterfinalGroups.length > 0) {
        // We have quarterfinals, advance to semifinals
        console.log(`[Knockout] Found quarterfinals, advancing to semifinals`);
        nextStage = 'semifinals';
        groups.length = 0; // Clear regular groups, use quarterfinals
        groups.push(...quarterfinalGroups);
      } else if (semifinalGroups.length > 0) {
        // We have semifinals, advance to finals
        console.log(`[Knockout] Found semifinals, advancing to finals`);
        nextStage = 'finals';
        groups.length = 0; // Clear regular groups, use semifinals
        groups.push(...semifinalGroups);
      } else if (finalGroups.length > 0) {
        // We already have finals, nothing to advance
        console.log(`[Knockout] Finals already exist, nothing to advance`);
        return { advanced: false, reason: 'Finals already exist' };
      } else {
        console.log(`[Knockout] Cannot determine next stage. Total groups: ${totalGroups}`);
        return { advanced: false, reason: 'Cannot determine next stage' };
      }
    }
    
    console.log(`[Knockout] Next stage determined: ${nextStage}, Groups to check: ${groups.length}`);
    
    // Check if all groups are completed
    let allCompleted = true;
    const qualifiedPairs: number[] = [];
    const incompleteGroups: string[] = [];
    
    // Check if these are knockout stage groups (contain "Match" in name) or regular groups
    const isKnockoutStage = groups.length > 0 && groups[0].group_name.toLowerCase().includes('match');
    
    for (const group of groups) {
      const isCompleted = await isGroupCompleted(group.id);
      console.log(`[Knockout] Group ${group.id} (${group.group_name}): completed = ${isCompleted}`);
      
      if (!isCompleted) {
        allCompleted = false;
        incompleteGroups.push(group.group_name);
        // Don't break, continue to log all groups
      } else {
        if (isKnockoutStage) {
          // For knockout stage: get winner from the match
          const winnerPairId = await getWinnerFromKnockoutMatch(group.id);
          if (winnerPairId) {
            console.log(`[Knockout] Group ${group.id} winner: pair ${winnerPairId}`);
            qualifiedPairs.push(winnerPairId);
          } else {
            console.error(`[Knockout] Group ${group.id} completed but no winner found`);
            allCompleted = false;
            incompleteGroups.push(group.group_name);
          }
        } else {
          // For regular groups: get top pairs from standings
        const topPairs = await getTopPairsFromGroup(group.id, pairsToAdvance);
        console.log(`[Knockout] Group ${group.id} top ${pairsToAdvance} pairs:`, topPairs);
        qualifiedPairs.push(...topPairs);
        }
      }
    }
    
    if (!allCompleted) {
      console.log(`[Knockout] Not all groups completed. Incomplete: ${incompleteGroups.join(', ')}`);
      return { advanced: false, reason: `Groups not completed: ${incompleteGroups.join(', ')}` };
    }
    
    if (!nextStage) {
      console.log(`[Knockout] No next stage determined`);
      return { advanced: false, reason: 'No next stage determined' };
    }
    
    if (qualifiedPairs.length === 0) {
      console.log(`[Knockout] No qualified pairs found`);
      return { advanced: false, reason: 'No qualified pairs found' };
    }
    
    console.log(`[Knockout] Total qualified pairs: ${qualifiedPairs.length}`);
    console.log(`[Knockout] Checking if ${nextStage} stage already exists...`);
    
    // Check if next stage already exists (more precise check to avoid false positives)
    let existingNextStageQuery = '';
    let queryParams: any[] = [tournamentId, category];
    
    if (nextStage === 'finals') {
      // For finals: search for "Final" but exclude "Semifinal" - use exact match pattern
      // IMPORTANT: Check for "Final" but NOT "Semifinal" - order matters in SQL
      existingNextStageQuery = `SELECT id, group_name FROM tournament_groups 
       WHERE tournament_id = ? AND category = ? 
       AND group_name NOT LIKE '%Semifinal%'
       AND group_name NOT LIKE '%semifinal%'
       AND group_name NOT LIKE '%Semi%'
       AND group_name NOT LIKE '%semi%'
       AND (group_name LIKE '%Final Match%' OR group_name LIKE '%final match%' OR group_name LIKE '%Final%' OR group_name LIKE '%final%')`;
      console.log(`[Knockout] Query for finals: looking for groups with "Final" but NOT "Semifinal"`);
    } else if (nextStage === 'semifinals') {
      // For semifinals: search for "Semifinal" but exclude "Quarterfinal"
      existingNextStageQuery = `SELECT id, group_name FROM tournament_groups 
       WHERE tournament_id = ? AND category = ? 
       AND (
         (group_name LIKE '%Semifinal%' OR group_name LIKE '%semifinal%' OR group_name LIKE '%Semi%' OR group_name LIKE '%semi%')
         AND group_name NOT LIKE '%Quarterfinal%'
         AND group_name NOT LIKE '%quarterfinal%'
         AND group_name NOT LIKE '%Quarter%'
         AND group_name NOT LIKE '%quarter%'
       )`;
      console.log(`[Knockout] Query for semifinals: looking for groups with "Semifinal" but NOT "Quarterfinal"`);
    } else if (nextStage === 'quarterfinals') {
      // For quarterfinals: search for "Quarterfinal"
      existingNextStageQuery = `SELECT id, group_name FROM tournament_groups 
       WHERE tournament_id = ? AND category = ? 
       AND (group_name LIKE '%Quarterfinal%' OR group_name LIKE '%quarterfinal%' OR group_name LIKE '%Quarter%' OR group_name LIKE '%quarter%')`;
      console.log(`[Knockout] Query for quarterfinals: looking for groups with "Quarterfinal"`);
    } else {
      console.error(`[Knockout] Unknown nextStage: ${nextStage}`);
      return { advanced: false, reason: `Unknown next stage: ${nextStage}` };
    }
    
    console.log(`[Knockout] Executing query for ${nextStage}:`, existingNextStageQuery);
    console.log(`[Knockout] Query params:`, queryParams);
    
    const [existingNextStage] = await pool.execute(
      existingNextStageQuery,
      queryParams
    ) as any[];
    
    console.log(`[Knockout] Query result for ${nextStage}: found ${existingNextStage.length} groups`);
    if (existingNextStage.length > 0) {
      console.log(`[Knockout] Found groups:`, existingNextStage.map((g: any) => g.group_name));
    }
    
    if (existingNextStage.length > 0) {
      console.log(`[Knockout] Next stage (${nextStage}) already exists:`, existingNextStage.map((g: any) => g.group_name));
      return { advanced: false, reason: `Next stage already exists: ${existingNextStage.map((g: any) => g.group_name).join(', ')}` };
    }
    
    console.log(`[Knockout] Next stage (${nextStage}) does not exist, proceeding to create it`);
    
    // Create next stage
    console.log(`[Knockout] Creating ${nextStage} stage with ${qualifiedPairs.length} qualified pairs`);
    const createdGroupIds = await createKnockoutStage(
      tournamentId,
      category,
      nextStage,
      qualifiedPairs
    );
    
    console.log(`[Knockout] Successfully created ${nextStage} stage. Group IDs:`, createdGroupIds);
    
    return {
      advanced: true,
      nextStage,
      groupIds: createdGroupIds,
    };
  } catch (error: any) {
    console.error('[Knockout] Error checking and advancing winners:', error);
    console.error('[Knockout] Error stack:', error.stack);
    return { advanced: false, reason: error.message || 'Unknown error' };
  }
}

