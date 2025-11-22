import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();
    
    // Получаем email пользователя
    const [userRows] = await pool.execute(
      'SELECT email FROM users WHERE id = ?',
      [session.userId]
    ) as any[];
    
    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userEmail = userRows[0].email;
    
    // Получаем матчи пользователя через регистрации
    const [matches] = await pool.execute(`
      SELECT 
        tm.id,
        tm.group_id,
        tm.pair1_id,
        tm.pair2_id,
        tm.pair1_games,
        tm.pair2_games,
        tm.pair1_points,
        tm.pair2_points,
        tm.pair1_set1,
        tm.pair1_set2,
        tm.pair1_set3,
        tm.pair2_set1,
        tm.pair2_set2,
        tm.pair2_set3,
        tm.winner_pair_id,
        tm.match_date,
        tm.court_number,
        tm.reported_at,
        tm.created_at,
        tg.group_name,
        tg.category,
        t.id as tournament_id,
        t.name as tournament_name,
        tgp1.player1_registration_id as pair1_player1_id,
        tgp1.player2_registration_id as pair1_player2_id,
        tgp2.player1_registration_id as pair2_player1_id,
        tgp2.player2_registration_id as pair2_player2_id,
        tr1.first_name as pair1_player1_first_name,
        tr1.last_name as pair1_player1_last_name,
        tr1.user_id as pair1_player1_user_id,
        tr1.email as pair1_player1_email,
        tr1p2.first_name as pair1_player2_first_name,
        tr1p2.last_name as pair1_player2_last_name,
        tr1p2.user_id as pair1_player2_user_id,
        tr1p2.email as pair1_player2_email,
        tr2.first_name as pair2_player1_first_name,
        tr2.last_name as pair2_player1_last_name,
        tr2.user_id as pair2_player1_user_id,
        tr2.email as pair2_player1_email,
        tr2p2.first_name as pair2_player2_first_name,
        tr2p2.last_name as pair2_player2_last_name,
        tr2p2.user_id as pair2_player2_user_id,
        tr2p2.email as pair2_player2_email
      FROM tournament_matches tm
      JOIN tournament_groups tg ON tm.group_id = tg.id
      JOIN tournaments t ON tg.tournament_id = t.id
      LEFT JOIN tournament_group_pairs tgp1 ON tm.pair1_id = tgp1.id
      LEFT JOIN tournament_group_pairs tgp2 ON tm.pair2_id = tgp2.id
      LEFT JOIN tournament_registrations tr1 ON tgp1.player1_registration_id = tr1.id
      LEFT JOIN tournament_registrations tr1p2 ON tgp1.player2_registration_id = tr1p2.id
      LEFT JOIN tournament_registrations tr2 ON tgp2.player1_registration_id = tr2.id
      LEFT JOIN tournament_registrations tr2p2 ON tgp2.player2_registration_id = tr2p2.id
      WHERE (tr1.user_id = ? OR tr1.email = ? OR tr1p2.user_id = ? OR tr1p2.email = ? 
             OR tr2.user_id = ? OR tr2.email = ? OR tr2p2.user_id = ? OR tr2p2.email = ?)
        AND tm.pair1_games IS NOT NULL
        AND tm.pair2_games IS NOT NULL
      ORDER BY tm.match_date DESC, tm.created_at DESC
    `, [
      session.userId, userEmail, session.userId, userEmail,
      session.userId, userEmail, session.userId, userEmail
    ]) as any[];

    // Подсчитываем статистику
    let wins = 0;
    let losses = 0;
    let totalGamesWon = 0;
    let totalGamesLost = 0;

    matches.forEach((m: any) => {
      // Проверяем, в какой паре находится пользователь
      const userInPair1 = (m.pair1_player1_user_id === session.userId || m.pair1_player1_email === userEmail) ||
                          (m.pair1_player2_user_id === session.userId || m.pair1_player2_email === userEmail);
      const userInPair2 = (m.pair2_player1_user_id === session.userId || m.pair2_player1_email === userEmail) ||
                          (m.pair2_player2_user_id === session.userId || m.pair2_player2_email === userEmail);
      
      if (userInPair1) {
        if (m.winner_pair_id === m.pair1_id) {
          wins++;
          totalGamesWon += m.pair1_games || 0;
          totalGamesLost += m.pair2_games || 0;
        } else {
          losses++;
          totalGamesWon += m.pair1_games || 0;
          totalGamesLost += m.pair2_games || 0;
        }
      } else if (userInPair2) {
        if (m.winner_pair_id === m.pair2_id) {
          wins++;
          totalGamesWon += m.pair2_games || 0;
          totalGamesLost += m.pair1_games || 0;
        } else {
          losses++;
          totalGamesWon += m.pair2_games || 0;
          totalGamesLost += m.pair1_games || 0;
        }
      }
    });

    return NextResponse.json({
      matches: matches.map((m: any) => ({
        id: m.id,
        groupId: m.group_id,
        groupName: m.group_name,
        category: m.category,
        tournamentId: m.tournament_id,
        tournamentName: m.tournament_name,
        pair1Id: m.pair1_id,
        pair2Id: m.pair2_id,
        pair1Games: m.pair1_games,
        pair2Games: m.pair2_games,
        pair1Set1: m.pair1_set1,
        pair1Set2: m.pair1_set2,
        pair1Set3: m.pair1_set3,
        pair2Set1: m.pair2_set1,
        pair2Set2: m.pair2_set2,
        pair2Set3: m.pair2_set3,
        pair1Points: m.pair1_points,
        pair2Points: m.pair2_points,
        winnerPairId: m.winner_pair_id,
        matchDate: m.match_date ? m.match_date.toISOString() : null,
        courtNumber: m.court_number,
        reportedAt: m.reported_at ? m.reported_at.toISOString() : null,
        createdAt: m.created_at ? m.created_at.toISOString() : new Date().toISOString(),
        pair1Players: [
          m.pair1_player1_first_name && m.pair1_player1_last_name 
            ? `${m.pair1_player1_first_name} ${m.pair1_player1_last_name}` 
            : null,
          m.pair1_player2_first_name && m.pair1_player2_last_name 
            ? `${m.pair1_player2_first_name} ${m.pair1_player2_last_name}` 
            : null
        ].filter(Boolean),
        pair2Players: [
          m.pair2_player1_first_name && m.pair2_player1_last_name 
            ? `${m.pair2_player1_first_name} ${m.pair2_player1_last_name}` 
            : null,
          m.pair2_player2_first_name && m.pair2_player2_last_name 
            ? `${m.pair2_player2_first_name} ${m.pair2_player2_last_name}` 
            : null
        ].filter(Boolean),
      })),
      statistics: {
        totalMatches: matches.length,
        wins,
        losses,
        winRate: matches.length > 0 ? ((wins / matches.length) * 100).toFixed(1) : '0.0',
        totalGamesWon,
        totalGamesLost,
      },
    });
  } catch (error: any) {
    console.error('Error fetching participant matches:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

