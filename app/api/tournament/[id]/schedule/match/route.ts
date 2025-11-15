import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

// PUT - обновить время и корт матча (только для superadmin/staff)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверка авторизации
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || (session.role !== 'superadmin' && session.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const tournamentId = parseInt(id, 10);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const body = await request.json();
    const { matchId, matchDate, courtNumber } = body;

    if (!matchId || !matchDate || !courtNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pool = getDbPool();

    // Проверяем, что матч принадлежит этому турниру
    const [matchCheck] = await pool.execute(
      `SELECT m.id FROM tournament_matches m
       JOIN tournament_groups g ON m.group_id = g.id
       WHERE m.id = ? AND g.tournament_id = ?`,
      [matchId, tournamentId]
    ) as any[];

    if (matchCheck.length === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Обновляем матч
    await pool.execute(
      `UPDATE tournament_matches 
       SET match_date = ?, court_number = ?, updated_at = NOW()
       WHERE id = ?`,
      [new Date(matchDate), parseInt(courtNumber), matchId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating match:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update match' },
      { status: 500 }
    );
  }
}

