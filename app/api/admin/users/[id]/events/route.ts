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

    // Получаем турниры, на которые зарегистрирован пользователь (events)
    const [events] = await pool.execute(`
      SELECT DISTINCT
        t.id,
        t.name,
        t.description,
        t.start_date,
        t.end_date,
        t.location,
        t.status,
        t.event_schedule,
        tr.id as registration_id,
        tr.confirmed,
        tr.confirmed_at,
        tr.created_at as registered_at
      FROM tournaments t
      JOIN tournament_registrations tr ON t.id = tr.tournament_id
      WHERE tr.email = ?
      ORDER BY t.start_date DESC
    `, [user.email]) as any[];

    return NextResponse.json({
      events: events.map((e: any) => ({
        id: e.id,
        name: e.name,
        description: e.description,
        startDate: e.start_date ? e.start_date.toISOString() : null,
        endDate: e.end_date ? e.end_date.toISOString() : null,
        location: e.location,
        status: e.status,
        eventSchedule: typeof e.event_schedule === 'string' ? JSON.parse(e.event_schedule) : e.event_schedule,
        registrationId: e.registration_id,
        confirmed: e.confirmed,
        confirmedAt: e.confirmed_at ? e.confirmed_at.toISOString() : null,
        registeredAt: e.registered_at ? e.registered_at.toISOString() : new Date().toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching user events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

