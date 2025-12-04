import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';
import { checkClubAccessFromSession } from '@/lib/club-access';

export const dynamic = 'force-dynamic';

// GET - получить список цен клуба
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
    const [pricing] = await pool.execute(
      `SELECT id, club_id, type, name, description, price, currency, time_slot_start, time_slot_end, day_of_week, is_active, created_at, updated_at
       FROM pricing
       WHERE club_id = ?
       ORDER BY type, day_of_week, time_slot_start ASC`,
      [id]
    ) as any[];

    return NextResponse.json({ pricing });
  } catch (error: any) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 });
  }
}

// POST - создать новую цену
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
      return NextResponse.json({ error: 'Forbidden. You do not have access to manage pricing for this club.' }, { status: 403 });
    }

    const body = await request.json();
    const { type, name, description, price, currency, timeSlotStart, timeSlotEnd, dayOfWeek, isActive } = body;

    if (!type || !name || price === undefined) {
      return NextResponse.json({ error: 'Pricing type, name and price are required' }, { status: 400 });
    }

    const pool = getDbPool();
    
    const [clubs] = await pool.execute('SELECT name FROM clubs WHERE id = ?', [id]) as any[];
    if (clubs.length === 0) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const [result] = await pool.execute(
      `INSERT INTO pricing (club_id, type, name, description, price, currency, time_slot_start, time_slot_end, day_of_week, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        type,
        name,
        description || null,
        parseFloat(price),
        currency || 'EUR',
        timeSlotStart || null,
        timeSlotEnd || null,
        dayOfWeek || null,
        isActive !== undefined ? isActive : true,
      ]
    ) as any[];

    const pricingId = (result as any).insertId;

    const currentUser = await findUserById(session.userId);

    await logAction('create', 'pricing', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: pricingId,
      details: { clubId: id, clubName: clubs[0].name, type, name, price, currency },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true, pricingId });
  } catch (error: any) {
    console.error('Error creating pricing:', error);
    return NextResponse.json({ error: 'Failed to create pricing' }, { status: 500 });
  }
}

