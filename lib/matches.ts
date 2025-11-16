// Match results management utilities
import { getDbPool } from './db';

export interface Match {
  id: number;
  groupId: number;
  pair1Id: number;
  pair2Id: number;
  pair1Games: number | null;
  pair2Games: number | null;
  pair1Points: number;
  pair2Points: number;
  winnerPairId: number | null;
  matchDate: string | null;
  reportedAt: string | null;
  reportedBy: string | null;
  createdAt: string;
  updatedAt?: string;
}

const useDatabase = !!(
  process.env.DATABASE_HOST &&
  process.env.DATABASE_USER &&
  process.env.DATABASE_PASSWORD &&
  process.env.DATABASE_NAME
);

/**
 * Calculate points for a match result
 * Winner gets 2 points, loser gets 1 point
 * 
 * @param pair1Games Games won by pair 1
 * @param pair2Games Games won by pair 2
 * @returns { pair1Points, pair2Points, winnerPairId }
 */
export function calculateMatchPoints(
  pair1Games: number,
  pair2Games: number
): { pair1Points: number; pair2Points: number; winnerPairId: number | null } {
  if (pair1Games > pair2Games) {
    return { pair1Points: 2, pair2Points: 1, winnerPairId: 1 };
  } else if (pair2Games > pair1Games) {
    return { pair1Points: 1, pair2Points: 2, winnerPairId: 2 };
  } else {
    // Draw - both get 1 point (shouldn't happen in normal play, but handle it)
    return { pair1Points: 1, pair2Points: 1, winnerPairId: null };
  }
}

/**
 * Get all matches for a group
 */
export async function getGroupMatches(groupId: number): Promise<Match[]> {
  if (!useDatabase) return [];
  
  try {
    const pool = getDbPool();
    const [rows] = await pool.execute(
      `SELECT * FROM tournament_matches 
       WHERE group_id = ? 
       ORDER BY match_date DESC, created_at DESC`,
      [groupId]
    ) as any[];
    
    return rows.map((row: any) => ({
      id: row.id,
      groupId: row.group_id,
      pair1Id: row.pair1_id,
      pair2Id: row.pair2_id,
      pair1Games: row.pair1_games,
      pair2Games: row.pair2_games,
      pair1Points: row.pair1_points,
      pair2Points: row.pair2_points,
      winnerPairId: row.winner_pair_id,
      matchDate: row.match_date ? row.match_date.toISOString() : null,
      reportedAt: row.reported_at ? row.reported_at.toISOString() : null,
      reportedBy: row.reported_by,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
    }));
  } catch (error) {
    console.error('Error getting group matches:', error);
    return [];
  }
}

/**
 * Create or update a match result
 */
export async function saveMatchResult(
  groupId: number,
  pair1Id: number,
  pair2Id: number,
  pair1Games: number,
  pair2Games: number,
  reportedBy: string
): Promise<Match> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  const pool = getDbPool();
  const { pair1Points, pair2Points, winnerPairId } = calculateMatchPoints(pair1Games, pair2Games);
  const winnerId = winnerPairId === 1 ? pair1Id : winnerPairId === 2 ? pair2Id : null;
  
  // Check if match already exists
  const [existing] = await pool.execute(
    `SELECT * FROM tournament_matches 
     WHERE group_id = ? AND pair1_id = ? AND pair2_id = ?`,
    [groupId, pair1Id, pair2Id]
  ) as any[];
  
  if (existing.length > 0) {
    // Update existing match
    await pool.execute(
      `UPDATE tournament_matches 
       SET pair1_games = ?, pair2_games = ?, 
           pair1_points = ?, pair2_points = ?, 
           winner_pair_id = ?, 
           match_date = NOW(), 
           reported_at = NOW(), 
           reported_by = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [pair1Games, pair2Games, pair1Points, pair2Points, winnerId, reportedBy, existing[0].id]
    );
    
    const [updated] = await pool.execute(
      'SELECT * FROM tournament_matches WHERE id = ?',
      [existing[0].id]
    ) as any[];
    
    const row = updated[0];
    return {
      id: row.id,
      groupId: row.group_id,
      pair1Id: row.pair1_id,
      pair2Id: row.pair2_id,
      pair1Games: row.pair1_games,
      pair2Games: row.pair2_games,
      pair1Points: row.pair1_points,
      pair2Points: row.pair2_points,
      winnerPairId: row.winner_pair_id,
      matchDate: row.match_date ? row.match_date.toISOString() : null,
      reportedAt: row.reported_at ? row.reported_at.toISOString() : null,
      reportedBy: row.reported_by,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
    };
  } else {
    // Create new match
    const [result] = await pool.execute(
      `INSERT INTO tournament_matches (
        group_id, pair1_id, pair2_id, 
        pair1_games, pair2_games, 
        pair1_points, pair2_points, 
        winner_pair_id, match_date, reported_at, reported_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
      [groupId, pair1Id, pair2Id, pair1Games, pair2Games, pair1Points, pair2Points, winnerId, reportedBy]
    ) as any;
    
    const [rows] = await pool.execute(
      'SELECT * FROM tournament_matches WHERE id = ?',
      [result.insertId]
    ) as any[];
    
    const row = rows[0];
    return {
      id: row.id,
      groupId: row.group_id,
      pair1Id: row.pair1_id,
      pair2Id: row.pair2_id,
      pair1Games: row.pair1_games,
      pair2Games: row.pair2_games,
      pair1Points: row.pair1_points,
      pair2Points: row.pair2_points,
      winnerPairId: row.winner_pair_id,
      matchDate: row.match_date ? row.match_date.toISOString() : null,
      reportedAt: row.reported_at ? row.reported_at.toISOString() : null,
      reportedBy: row.reported_by,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
    };
  }
}

/**
 * Create missing matches for a group (round-robin)
 * This function will create all matches that should exist but don't
 */
export async function createMissingMatchesForGroup(groupId: number): Promise<{ created: number; matches: Match[] }> {
  if (!useDatabase) {
    throw new Error('Database not configured');
  }
  
  try {
    const pool = getDbPool();
    
    // Get all pairs in the group
    const [pairs] = await pool.execute(
      'SELECT id FROM tournament_group_pairs WHERE group_id = ? AND player1_registration_id IS NOT NULL',
      [groupId]
    ) as any[];
    
    if (pairs.length < 2) {
      console.log(`[createMissingMatchesForGroup] Group ${groupId}: Less than 2 pairs (${pairs.length}), cannot create matches`);
      return { created: 0, matches: [] };
    }
    
    // Generate all expected matches (round-robin)
    const pairIds = pairs.map((p: any) => p.id);
    const expectedMatches: Array<{ pair1Id: number; pair2Id: number }> = [];
    
    for (let i = 0; i < pairIds.length; i++) {
      for (let j = i + 1; j < pairIds.length; j++) {
        expectedMatches.push({
          pair1Id: pairIds[i],
          pair2Id: pairIds[j],
        });
      }
    }
    
    // Get existing matches
    const [existingMatches] = await pool.execute(
      `SELECT pair1_id, pair2_id FROM tournament_matches WHERE group_id = ?`,
      [groupId]
    ) as any[];
    
    const existingPairs = new Set(
      existingMatches.map((m: any) => `${Math.min(m.pair1_id, m.pair2_id)}-${Math.max(m.pair1_id, m.pair2_id)}`)
    );
    
    // Find missing matches
    const missingMatches = expectedMatches.filter(match => {
      const key = `${Math.min(match.pair1Id, match.pair2Id)}-${Math.max(match.pair1Id, match.pair2Id)}`;
      return !existingPairs.has(key);
    });
    
    if (missingMatches.length === 0) {
      console.log(`[createMissingMatchesForGroup] Group ${groupId}: All matches already exist`);
      return { created: 0, matches: [] };
    }
    
    console.log(`[createMissingMatchesForGroup] Group ${groupId}: Creating ${missingMatches.length} missing matches`);
    
    // Create missing matches
    const createdMatches: Match[] = [];
    for (const match of missingMatches) {
      const [result] = await pool.execute(
        `INSERT INTO tournament_matches (group_id, pair1_id, pair2_id, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
        [groupId, match.pair1Id, match.pair2Id]
      ) as any;
      
      const [rows] = await pool.execute(
        'SELECT * FROM tournament_matches WHERE id = ?',
        [result.insertId]
      ) as any[];
      
      const row = rows[0];
      createdMatches.push({
        id: row.id,
        groupId: row.group_id,
        pair1Id: row.pair1_id,
        pair2Id: row.pair2_id,
        pair1Games: row.pair1_games,
        pair2Games: row.pair2_games,
        pair1Points: row.pair1_points,
        pair2Points: row.pair2_points,
        winnerPairId: row.winner_pair_id,
        matchDate: row.match_date ? row.match_date.toISOString() : null,
        reportedAt: row.reported_at ? row.reported_at.toISOString() : null,
        reportedBy: row.reported_by,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
      });
    }
    
    console.log(`[createMissingMatchesForGroup] Group ${groupId}: ✅ Created ${createdMatches.length} matches`);
    return { created: createdMatches.length, matches: createdMatches };
  } catch (error: any) {
    console.error(`[createMissingMatchesForGroup] Error creating matches for group ${groupId}:`, error);
    throw error;
  }
}

/**
 * Get standings for a group (points, games won/lost, average)
 */
export async function getGroupStandings(groupId: number): Promise<any[]> {
  if (!useDatabase) return [];
  
  try {
    const pool = getDbPool();
    
    // Get all pairs in the group
    const [pairs] = await pool.execute(
      'SELECT id, pair_number FROM tournament_group_pairs WHERE group_id = ?',
      [groupId]
    ) as any[];
    
    // Get all matches for the group
    const matches = await getGroupMatches(groupId);
    
    // Calculate standings
    const standings: Record<number, {
      pairId: number;
      pairNumber: number;
      points: number;
      gamesWon: number;
      gamesLost: number;
      average: number;
      wins: number;
      losses: number;
    }> = {};
    
    // Initialize standings
    for (const pair of pairs) {
      standings[pair.id] = {
        pairId: pair.id,
        pairNumber: pair.pair_number,
        points: 0,
        gamesWon: 0,
        gamesLost: 0,
        average: 0,
        wins: 0,
        losses: 0,
      };
    }
    
    // Calculate from matches
    for (const match of matches) {
      if (match.pair1Games !== null && match.pair2Games !== null) {
        const pair1 = standings[match.pair1Id];
        const pair2 = standings[match.pair2Id];
        
        if (pair1 && pair2) {
          pair1.points += match.pair1Points;
          pair2.points += match.pair2Points;
          pair1.gamesWon += match.pair1Games;
          pair1.gamesLost += match.pair2Games;
          pair2.gamesWon += match.pair2Games;
          pair2.gamesLost += match.pair1Games;
          
          if (match.winnerPairId === match.pair1Id) {
            pair1.wins++;
            pair2.losses++;
          } else if (match.winnerPairId === match.pair2Id) {
            pair2.wins++;
            pair1.losses++;
          }
        }
      }
    }
    
    // Calculate average (games won - games lost)
    for (const pairId in standings) {
      standings[pairId].average = standings[pairId].gamesWon - standings[pairId].gamesLost;
    }
    
    // Helper function to find direct match result between two pairs
    const getDirectMatchResult = (pair1Id: number, pair2Id: number): { pair1Won: boolean | null } => {
      const match = matches.find(m => 
        (m.pair1Id === pair1Id && m.pair2Id === pair2Id) ||
        (m.pair1Id === pair2Id && m.pair2Id === pair1Id)
      );
      
      if (!match || match.pair1Games === null || match.pair2Games === null) {
        return { pair1Won: null };
      }
      
      // Check which pair won
      if (match.pair1Id === pair1Id) {
        return { pair1Won: match.pair1Games > match.pair2Games };
      } else {
        return { pair1Won: match.pair2Games > match.pair1Games };
      }
    };
    
    // Sort by points (desc), then by average (desc), then by direct match result, then by games won (desc)
    return Object.values(standings).sort((a, b) => {
      // 1. Sort by points (descending)
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      
      // 2. If points are equal, sort by average (descending)
      if (b.average !== a.average) {
        return b.average - a.average;
      }
      
      // 3. If points and average are equal, check direct match result
      const directMatch = getDirectMatchResult(a.pairId, b.pairId);
      if (directMatch.pair1Won !== null) {
        // If pair a won directly against pair b, pair a should be higher
        if (directMatch.pair1Won) {
          return -1; // a comes before b
        } else {
          return 1; // b comes before a
        }
      }
      
      // 4. If no direct match or it was a draw, sort by games won (descending)
      return b.gamesWon - a.gamesWon;
    });
  } catch (error) {
    console.error('Error getting group standings:', error);
    return [];
  }
}

