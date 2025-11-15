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
    
    // Получаем пользователя по email или id
    const [userRows] = await pool.execute(
      'SELECT id, email FROM users WHERE id = ? OR email = ?',
      [userId, userId]
    ) as any[];

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRows[0];

    // Получаем регистрации на турниры (bookings)
    const [bookings] = await pool.execute(`
      SELECT 
        tr.id,
        tr.tournament_id,
        tr.tournament_name,
        tr.categories,
        tr.confirmed,
        tr.confirmed_at,
        tr.created_at,
        t.start_date,
        t.end_date,
        t.location,
        t.status as tournament_status
      FROM tournament_registrations tr
      JOIN tournaments t ON tr.tournament_id = t.id
      WHERE tr.email = ?
      ORDER BY tr.created_at DESC
    `, [user.email]) as any[];

    return NextResponse.json({
      bookings: bookings.map((b: any) => ({
        id: b.id,
        tournamentId: b.tournament_id,
        tournamentName: b.tournament_name,
        categories: typeof b.categories === 'string' ? JSON.parse(b.categories) : b.categories,
        confirmed: b.confirmed,
        confirmedAt: b.confirmed_at ? b.confirmed_at.toISOString() : null,
        createdAt: b.created_at ? b.created_at.toISOString() : new Date().toISOString(),
        startDate: b.start_date ? b.start_date.toISOString() : null,
        endDate: b.end_date ? b.end_date.toISOString() : null,
        location: b.location,
        tournamentStatus: b.tournament_status,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching user bookings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

