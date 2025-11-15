import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pool = getDbPool();
    
    // Получаем пользователя
    const [userRows] = await pool.execute(
      'SELECT id, email FROM users WHERE id = ? OR email = ?',
      [userId, userId]
    ) as any[];

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRows[0];

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
        tm.winner_pair_id,
        tm.match_date,
        tm.court_number,
        tm.reported_at,
        tm.created_at,
        tg.group_name,
        tg.category,
        t.id as tournament_id,
        t.name as tournament_name,
        tr1.first_name as pair1_player1_first_name,
        tr1.last_name as pair1_player1_last_name,
        tr2.first_name as pair2_player1_first_name,
        tr2.last_name as pair2_player1_last_name
      FROM tournament_matches tm
      JOIN tournament_groups tg ON tm.group_id = tg.id
      JOIN tournaments t ON tg.tournament_id = t.id
      LEFT JOIN tournament_group_pairs tgp1 ON tm.pair1_id = tgp1.id
      LEFT JOIN tournament_group_pairs tgp2 ON tm.pair2_id = tgp2.id
      LEFT JOIN tournament_registrations tr1 ON tgp1.player1_registration_id = tr1.id
      LEFT JOIN tournament_registrations tr2 ON tgp2.player1_registration_id = tr2.id
      WHERE tr1.email = ? OR tr2.email = ?
      ORDER BY tm.match_date DESC, tm.created_at DESC
    `, [user.email, user.email]) as any[];

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
        pair1Points: m.pair1_points,
        pair2Points: m.pair2_points,
        winnerPairId: m.winner_pair_id,
        matchDate: m.match_date ? m.match_date.toISOString() : null,
        courtNumber: m.court_number,
        reportedAt: m.reported_at ? m.reported_at.toISOString() : null,
        createdAt: m.created_at ? m.created_at.toISOString() : new Date().toISOString(),
        pair1Player: m.pair1_player1_first_name && m.pair1_player1_last_name 
          ? `${m.pair1_player1_first_name} ${m.pair1_player1_last_name}` 
          : null,
        pair2Player: m.pair2_player1_first_name && m.pair2_player1_last_name 
          ? `${m.pair2_player1_first_name} ${m.pair2_player1_last_name}` 
          : null,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching user matches:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

