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
    
    // Получаем все регистрации пользователя
    const [registrations] = await pool.execute(`
      SELECT 
        tr.id,
        tr.token,
        tr.tournament_id,
        tr.tournament_name,
        tr.confirmed,
        tr.created_at,
        tr.confirmed_at,
        t.start_date,
        t.end_date,
        t.status
      FROM tournament_registrations tr
      JOIN tournaments t ON tr.tournament_id = t.id
      WHERE tr.user_id = ? OR tr.email = ?
      ORDER BY t.start_date DESC, tr.created_at DESC
    `, [session.userId, userEmail]) as any[];

    return NextResponse.json({
      registrations: registrations.map((r: any) => ({
        id: r.id,
        token: r.token,
        tournamentId: r.tournament_id,
        tournamentName: r.tournament_name,
        confirmed: !!r.confirmed,
        createdAt: r.created_at ? r.created_at.toISOString() : null,
        confirmedAt: r.confirmed_at ? r.confirmed_at.toISOString() : null,
        tournamentStartDate: r.start_date ? r.start_date.toISOString() : null,
        tournamentEndDate: r.end_date ? r.end_date.toISOString() : null,
        tournamentStatus: r.status,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching user registrations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}

