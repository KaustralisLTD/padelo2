import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';
import { checkClubAccessFromSession } from '@/lib/club-access';

export const dynamic = 'force-dynamic';

// GET - получить список праздников клуба
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const access = await checkClubAccessFromSession(token, parseInt(id));
    if (!access.authorized && session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. You do not have access to this club.' }, { status: 403 });
    }

    const pool = getDbPool();
    const [holidays] = await pool.execute(
      `SELECT id, club_id, name, date, is_recurring, recurring_pattern, created_at, updated_at
       FROM holidays
       WHERE club_id = ?
       ORDER BY date ASC`,
      [id]
    ) as any[];

    return NextResponse.json({ holidays });
  } catch (error: any) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
  }
}

// POST - создать новый праздник
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const access = await checkClubAccessFromSession(token, parseInt(id), 'admin');
    if (!access.authorized && session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. You do not have access to manage holidays for this club.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, date, isRecurring, recurringPattern } = body;

    if (!name || !date) {
      return NextResponse.json({ error: 'Holiday name and date are required' }, { status: 400 });
    }

    const pool = getDbPool();
    
    const [clubs] = await pool.execute('SELECT name FROM clubs WHERE id = ?', [id]) as any[];
    if (clubs.length === 0) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const [result] = await pool.execute(
      `INSERT INTO holidays (club_id, name, date, is_recurring, recurring_pattern, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        id,
        name,
        date,
        isRecurring || false,
        recurringPattern || null,
      ]
    ) as any[];

    const holidayId = (result as any).insertId;

    const currentUser = await findUserById(session.userId);

    await logAction('create', 'holiday', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: holidayId,
      details: { clubId: id, clubName: clubs[0].name, name, date, isRecurring },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true, holidayId });
  } catch (error: any) {
    console.error('Error creating holiday:', error);
    return NextResponse.json({ error: 'Failed to create holiday' }, { status: 500 });
  }
}

