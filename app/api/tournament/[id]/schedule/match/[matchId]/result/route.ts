import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { saveMatchResult } from '@/lib/matches';
import { checkAndAdvanceWinners } from '@/lib/knockout';
import { getDbPool } from '@/lib/db';

/**
 * PUT - сохранить результат матча по ID матча
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (session?.role !== 'superadmin' && session?.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, matchId } = await params;
    const tournamentId = parseInt(id, 10);
    const matchIdNum = parseInt(matchId, 10);

    if (isNaN(tournamentId) || isNaN(matchIdNum)) {
      return NextResponse.json({ error: 'Invalid tournament or match ID' }, { status: 400 });
    }

    const body = await request.json();
    const { isKnockout, pair1Games, pair2Games, pair1Set1, pair1Set2, pair1Set3, pair2Set1, pair2Set2, pair2Set3 } = body;

    const pool = getDbPool();

    // Получаем информацию о матче
    const [matchInfo] = await pool.execute(
      `SELECT m.group_id, m.pair1_id, m.pair2_id, g.tournament_id, g.category, g.group_name
       FROM tournament_matches m
       JOIN tournament_groups g ON m.group_id = g.id
       WHERE m.id = ? AND g.tournament_id = ?`,
      [matchIdNum, tournamentId]
    ) as any[];

    if (matchInfo.length === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const match = matchInfo[0];
    
    // Определяем, является ли это knockout-матчем
    const isKnockoutMatch = isKnockout || match.group_name?.toLowerCase().includes('match') ||
                           match.group_name?.toLowerCase().includes('quarterfinal') ||
                           match.group_name?.toLowerCase().includes('semifinal') ||
                           match.group_name?.toLowerCase().includes('final');

    let savedMatch: any;

    if (isKnockoutMatch) {
      // Для knockout-матчей: сохраняем sets
      if (pair1Set1 === undefined || pair1Set2 === undefined || pair2Set1 === undefined || pair2Set2 === undefined) {
        return NextResponse.json(
          { error: 'pair1Set1, pair1Set2, pair2Set1, pair2Set2 are required for knockout matches' },
          { status: 400 }
        );
      }

      // Валидация sets
      // СЕТ 1 и СЕТ 2: разрешаем 0-7 (может быть 7-6 при таймбрейке)
      // СЕТ 3: разрешаем любые значения (может быть 15-13 и больше при таймбрейке)
      if (pair1Set1 < 0 || pair1Set1 > 7 || pair1Set2 < 0 || pair1Set2 > 7 ||
          pair2Set1 < 0 || pair2Set1 > 7 || pair2Set2 < 0 || pair2Set2 > 7) {
        return NextResponse.json(
          { error: 'Invalid set score (must be 0-7 for set 1 and 2, 7 is allowed for tiebreak)' },
          { status: 400 }
        );
      }

      // СЕТ 3: разрешаем любые положительные значения (таймбрейк может быть до любого счета с разницей в 2 очка)
      if (pair1Set3 !== null && pair1Set3 !== undefined && pair1Set3 < 0) {
        return NextResponse.json(
          { error: 'Invalid set 3 score (must be 0 or greater)' },
          { status: 400 }
        );
      }

      if (pair2Set3 !== null && pair2Set3 !== undefined && pair2Set3 < 0) {
        return NextResponse.json(
          { error: 'Invalid set 3 score (must be 0 or greater)' },
          { status: 400 }
        );
      }

      // Определяем победителя на основе sets
      let winnerPairId: number | null = null;
      let pair1Games = 0, pair2Games = 0; // Для совместимости с существующей логикой
      
      // Подсчитываем выигранные sets
      if (pair1Set1 > pair2Set1) pair1Games++;
      else if (pair2Set1 > pair1Set1) pair2Games++;
      
      if (pair1Set2 > pair2Set2) pair1Games++;
      else if (pair2Set2 > pair1Set2) pair2Games++;
      
      // Если 1:1 по sets, проверяем set 3
      if (pair1Games === 1 && pair2Games === 1) {
        if (pair1Set3 !== null && pair1Set3 !== undefined && pair2Set3 !== null && pair2Set3 !== undefined) {
          if (pair1Set3 > pair2Set3) {
            pair1Games++;
            winnerPairId = match.pair1_id;
          } else if (pair2Set3 > pair1Set3) {
            pair2Games++;
            winnerPairId = match.pair2_id;
          }
        }
      } else {
        // Победитель определен по первым двум sets
        winnerPairId = pair1Games > pair2Games ? match.pair1_id : match.pair2_id;
      }

      // Обновляем матч с sets
      await pool.execute(
        `UPDATE tournament_matches 
         SET pair1_set1 = ?, pair1_set2 = ?, pair1_set3 = ?,
             pair2_set1 = ?, pair2_set2 = ?, pair2_set3 = ?,
             pair1_games = ?, pair2_games = ?,
             pair1_points = ?, pair2_points = ?,
             winner_pair_id = ?,
             match_date = NOW(),
             reported_at = NOW(),
             reported_by = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          pair1Set1, pair1Set2, pair1Set3 || null,
          pair2Set1, pair2Set2, pair2Set3 || null,
          pair1Games, pair2Games,
          pair1Games > pair2Games ? 2 : 1, pair2Games > pair1Games ? 2 : 1, // Points
          winnerPairId,
          session.userId,
          matchIdNum
        ]
      );

      // Получаем обновленный матч
      const [updated] = await pool.execute(
        'SELECT * FROM tournament_matches WHERE id = ?',
        [matchIdNum]
      ) as any[];

      const row = updated[0];
      savedMatch = {
        id: row.id,
        groupId: row.group_id,
        pair1Id: row.pair1_id,
        pair2Id: row.pair2_id,
        pair1Games: row.pair1_games,
        pair2Games: row.pair2_games,
        pair1Set1: row.pair1_set1,
        pair1Set2: row.pair1_set2,
        pair1Set3: row.pair1_set3,
        pair2Set1: row.pair2_set1,
        pair2Set2: row.pair2_set2,
        pair2Set3: row.pair2_set3,
        winnerPairId: row.winner_pair_id,
        matchDate: row.match_date ? row.match_date.toISOString() : null,
        reportedAt: row.reported_at ? row.reported_at.toISOString() : null,
        reportedBy: row.reported_by,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
      };
    } else {
      // Для обычных матчей: используем games
      if (pair1Games === undefined || pair2Games === undefined) {
        return NextResponse.json(
          { error: 'pair1Games and pair2Games are required' },
          { status: 400 }
        );
      }

      if (pair1Games < 0 || pair2Games < 0 || pair1Games > 9 || pair2Games > 9) {
        return NextResponse.json(
          { error: 'Invalid games score (must be 0-9)' },
          { status: 400 }
        );
      }

      // Сохраняем результат
      savedMatch = await saveMatchResult(
        match.group_id,
        match.pair1_id,
        match.pair2_id,
        pair1Games,
        pair2Games,
        session.userId
      );
    }

    // Проверяем, завершена ли группа и нужно ли продвинуть победителей
    const advancement = await checkAndAdvanceWinners(
      match.tournament_id,
      match.category
    );

    return NextResponse.json({
      success: true,
      match: savedMatch,
      advancement: advancement.advanced ? {
        nextStage: advancement.nextStage,
        message: `Winners advanced to ${advancement.nextStage}`
      } : null
    });
  } catch (error: any) {
    console.error('Error saving match result:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save match result' },
      { status: 500 }
    );
  }
}

