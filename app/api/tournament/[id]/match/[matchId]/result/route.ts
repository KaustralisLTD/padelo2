import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const { id, matchId } = await params;
    const tournamentId = parseInt(id, 10);
    const matchIdNum = parseInt(matchId, 10);

    if (isNaN(tournamentId) || isNaN(matchIdNum)) {
      return NextResponse.json(
        { error: 'Invalid tournament or match ID' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      pair1Games,
      pair2Games,
      pair1Set1,
      pair1Set2,
      pair1Set3,
      pair2Set1,
      pair2Set2,
      pair2Set3,
    } = body;

    if (pair1Games === undefined || pair2Games === undefined) {
      return NextResponse.json(
        { error: 'Games scores are required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Get match details
    const [matches] = await pool.execute(
      `SELECT m.*, 
              p1.player1_registration_id as pair1_player1_id,
              p1.player2_registration_id as pair1_player2_id,
              p2.player1_registration_id as pair2_player1_id,
              p2.player2_registration_id as pair2_player2_id
       FROM tournament_matches m
       LEFT JOIN tournament_group_pairs p1 ON m.pair1_id = p1.id
       LEFT JOIN tournament_group_pairs p2 ON m.pair2_id = p2.id
       WHERE m.id = ?`,
      [matchIdNum]
    ) as any[];

    if (matches.length === 0) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    const match = matches[0];

    // Get user's registration ID
    const [userRegs] = await pool.execute(
      `SELECT id FROM tournament_registrations 
       WHERE email = (SELECT email FROM users WHERE id = ?) 
       AND tournament_id = ?`,
      [session.userId, tournamentId]
    ) as any[];

    if (userRegs.length === 0) {
      return NextResponse.json(
        { error: 'User not registered for this tournament' },
        { status: 403 }
      );
    }

    const userRegistrationId = userRegs[0].id;

    // Check if user is in pair1 or pair2
    const isInPair1 = match.pair1_player1_id === userRegistrationId || 
                      match.pair1_player2_id === userRegistrationId;
    const isInPair2 = match.pair2_player1_id === userRegistrationId || 
                      match.pair2_player2_id === userRegistrationId;

    if (!isInPair1 && !isInPair2) {
      return NextResponse.json(
        { error: 'User is not a participant in this match' },
        { status: 403 }
      );
    }

    const isPair1 = isInPair1;

    // Check if result is already confirmed
    if (match.result_confirmed) {
      return NextResponse.json(
        { error: 'Result already confirmed' },
        { status: 400 }
      );
    }

    // Save result from this pair
    if (isPair1) {
      await pool.execute(
        `UPDATE tournament_matches 
         SET pair1_result_reported_by = ?,
             pair1_result_reported_at = NOW(),
             pair1_result_pair1_games = ?,
             pair1_result_pair2_games = ?,
             pair1_set1 = ?,
             pair1_set2 = ?,
             pair1_set3 = ?,
             pair2_set1 = ?,
             pair2_set2 = ?,
             pair2_set3 = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          session.userId,
          pair1Games,
          pair2Games,
          pair1Set1 || null,
          pair1Set2 || null,
          pair1Set3 || null,
          pair2Set1 || null,
          pair2Set2 || null,
          pair2Set3 || null,
          matchIdNum,
        ]
      );
    } else {
      await pool.execute(
        `UPDATE tournament_matches 
         SET pair2_result_reported_by = ?,
             pair2_result_reported_at = NOW(),
             pair2_result_pair1_games = ?,
             pair2_result_pair2_games = ?,
             pair1_set1 = ?,
             pair1_set2 = ?,
             pair1_set3 = ?,
             pair2_set1 = ?,
             pair2_set2 = ?,
             pair2_set3 = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          session.userId,
          pair1Games,
          pair2Games,
          pair1Set1 || null,
          pair1Set2 || null,
          pair1Set3 || null,
          pair2Set1 || null,
          pair2Set2 || null,
          pair2Set3 || null,
          matchIdNum,
        ]
      );
    }

    // Check if both pairs have reported and results match
    const [updatedMatch] = await pool.execute(
      `SELECT * FROM tournament_matches WHERE id = ?`,
      [matchIdNum]
    ) as any[];

    const updated = updatedMatch[0];

    if (updated.pair1_result_reported_by && updated.pair2_result_reported_by) {
      // Both pairs have reported - check if results match
      const resultsMatch = 
        updated.pair1_result_pair1_games === updated.pair2_result_pair1_games &&
        updated.pair1_result_pair2_games === updated.pair2_result_pair2_games;

      if (resultsMatch) {
        // Results match - confirm and save to main fields
        await pool.execute(
          `UPDATE tournament_matches 
           SET pair1_games = ?,
               pair2_games = ?,
               pair1_points = CASE WHEN ? > ? THEN 2 WHEN ? < ? THEN 0 ELSE 1 END,
               pair2_points = CASE WHEN ? < ? THEN 2 WHEN ? > ? THEN 0 ELSE 1 END,
               winner_pair_id = CASE WHEN ? > ? THEN pair1_id WHEN ? < ? THEN pair2_id ELSE NULL END,
               result_confirmed = TRUE,
               result_confirmed_at = NOW(),
               reported_at = NOW(),
               reported_by = ?,
               updated_at = NOW()
           WHERE id = ?`,
          [
            updated.pair1_result_pair1_games,
            updated.pair1_result_pair2_games,
            updated.pair1_result_pair1_games,
            updated.pair1_result_pair2_games,
            updated.pair1_result_pair1_games,
            updated.pair1_result_pair2_games,
            updated.pair1_result_pair1_games,
            updated.pair1_result_pair2_games,
            updated.pair1_result_pair1_games,
            updated.pair1_result_pair2_games,
            updated.pair1_result_pair1_games,
            updated.pair1_result_pair2_games,
            updated.pair1_result_pair1_games,
            updated.pair1_result_pair2_games,
            session.userId,
            matchIdNum,
          ]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Result submitted successfully',
      confirmed: updated.pair1_result_reported_by && updated.pair2_result_reported_by && 
                 updated.pair1_result_pair1_games === updated.pair2_result_pair1_games &&
                 updated.pair1_result_pair2_games === updated.pair2_result_pair2_games,
    });
  } catch (error: any) {
    console.error('Error submitting match result:', error);
    return NextResponse.json(
      { error: 'Failed to submit result', details: error.message },
      { status: 500 }
    );
  }
}

