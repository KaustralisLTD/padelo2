import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';
import { checkClubAccessFromSession } from '@/lib/club-access';

export const dynamic = 'force-dynamic';

// GET - получить информацию о празднике
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; holidayId: string }> }
) {
  try {
    const { id, holidayId } = await params;
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
       WHERE id = ? AND club_id = ?`,
      [holidayId, id]
    ) as any[];

    if (holidays.length === 0) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({ holiday: holidays[0] });
  } catch (error: any) {
    console.error('Error fetching holiday:', error);
    return NextResponse.json({ error: 'Failed to fetch holiday' }, { status: 500 });
  }
}

// PUT - обновить праздник
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; holidayId: string }> }
) {
  try {
    const { id, holidayId } = await params;
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
    await pool.execute(
      `UPDATE holidays
       SET name = ?, date = ?, is_recurring = ?, recurring_pattern = ?, updated_at = NOW()
       WHERE id = ? AND club_id = ?`,
      [
        name,
        date,
        isRecurring || false,
        recurringPattern || null,
        holidayId,
        id,
      ]
    );

    const currentUser = await findUserById(session.userId);

    await logAction('update', 'holiday', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: holidayId,
      details: { clubId: id, name, date, isRecurring },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating holiday:', error);
    return NextResponse.json({ error: 'Failed to update holiday' }, { status: 500 });
  }
}

// DELETE - удалить праздник
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; holidayId: string }> }
) {
  try {
    const { id, holidayId } = await params;
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

    const pool = getDbPool();
    
    const [holidays] = await pool.execute(
      'SELECT name FROM holidays WHERE id = ? AND club_id = ?',
      [holidayId, id]
    ) as any[];

    if (holidays.length === 0) {
      return NextResponse.json({ error: 'Holiday not found' }, { status: 404 });
    }

    await pool.execute('DELETE FROM holidays WHERE id = ? AND club_id = ?', [holidayId, id]);

    const currentUser = await findUserById(session.userId);

    await logAction('delete', 'holiday', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: holidayId,
      details: { clubId: id, name: holidays[0].name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json({ error: 'Failed to delete holiday' }, { status: 500 });
  }
}

