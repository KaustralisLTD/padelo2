import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

/**
 * GET - получить турнирную таблицу (bracket) для турнира
 * Возвращает все группы и пары по категориям
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = parseInt(params.id, 10);
    
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const pool = getDbPool();
    
    // Get all groups for this tournament
    const [groups] = await pool.execute(
      `SELECT * FROM tournament_groups 
       WHERE tournament_id = ? 
       ORDER BY category, group_number`,
      [tournamentId]
    ) as any[];

    // Get all pairs for all groups (оптимизация: один запрос вместо множественных)
    const groupIds = groups.map(g => g.id);
    if (groupIds.length === 0) {
      return NextResponse.json({ bracket: {} });
    }

    const placeholders = groupIds.map(() => '?').join(',');
    const [allPairs] = await pool.execute(
      `SELECT * FROM tournament_group_pairs 
       WHERE group_id IN (${placeholders})
       ORDER BY group_id, pair_number`,
      groupIds
    ) as any[];

    // Get all registration IDs
    const registrationIds = new Set<number>();
    allPairs.forEach((pair: any) => {
      if (pair.player1_registration_id) registrationIds.add(pair.player1_registration_id);
      if (pair.player2_registration_id) registrationIds.add(pair.player2_registration_id);
    });

    // Get all registrations in one query
    const registrationsMap = new Map<number, any>();
    if (registrationIds.size > 0) {
      const regPlaceholders = Array.from(registrationIds).map(() => '?').join(',');
      const [registrations] = await pool.execute(
        `SELECT id, first_name, last_name, email, partner_name, partner_email
         FROM tournament_registrations
         WHERE id IN (${regPlaceholders})`,
        Array.from(registrationIds)
      ) as any[];
      
      registrations.forEach((reg: any) => {
        registrationsMap.set(reg.id, reg);
      });
    }

    // Build bracket structure
    const bracket: Record<string, any[]> = {};
    const pairsByGroupId = new Map<number, any[]>();
    
    allPairs.forEach((pair: any) => {
      if (!pairsByGroupId.has(pair.group_id)) {
        pairsByGroupId.set(pair.group_id, []);
      }
      pairsByGroupId.get(pair.group_id)!.push(pair);
    });

    for (const group of groups) {
      const category = group.category;
      if (!bracket[category]) {
        bracket[category] = [];
      }

      const pairs = pairsByGroupId.get(group.id) || [];
      const groupData: any = {
        id: group.id,
        category: group.category,
        groupName: group.group_name,
        groupNumber: group.group_number,
        maxPairs: group.max_pairs,
        startTime: group.start_time ? group.start_time.toISOString() : null,
        pairs: [],
      };

      for (const pair of pairs) {
        const pairData: any = {
          id: pair.id,
          pairNumber: pair.pair_number,
          players: [],
        };

        // Get player 1 registration from map
        if (pair.player1_registration_id) {
          const player1 = registrationsMap.get(pair.player1_registration_id);
          if (player1) {
            pairData.players.push({
              registrationId: player1.id,
              firstName: player1.first_name,
              lastName: player1.last_name,
              email: player1.email,
              isPartner: false,
            });
            
            if (player1.partner_name && player1.partner_email) {
              pairData.players.push({
                registrationId: player1.id,
                firstName: player1.partner_name,
                lastName: '',
                email: player1.partner_email,
                isPartner: true,
              });
            }
          }
        }

        // Get player 2 registration from map
        if (pair.player2_registration_id) {
          const player2 = registrationsMap.get(pair.player2_registration_id);
          if (player2) {
            pairData.players.push({
              registrationId: player2.id,
              firstName: player2.first_name,
              lastName: player2.last_name,
              email: player2.email,
              isPartner: false,
            });
            
            if (player2.partner_name && player2.partner_email) {
              pairData.players.push({
                registrationId: player2.id,
                firstName: player2.partner_name,
                lastName: '',
                email: player2.partner_email,
                isPartner: true,
              });
            }
          }
        }

        groupData.pairs.push(pairData);
      }

      bracket[category].push(groupData);
    }

    return NextResponse.json({ bracket });
  } catch (error: any) {
    console.error('Error getting tournament bracket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get tournament bracket' },
      { status: 500 }
    );
  }
}

