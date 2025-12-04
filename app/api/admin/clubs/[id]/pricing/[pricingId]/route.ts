import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';
import { checkClubAccessFromSession } from '@/lib/club-access';

export const dynamic = 'force-dynamic';

// GET - получить информацию о цене
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pricingId: string }> }
) {
  try {
    const { id, pricingId } = await params;
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
       WHERE id = ? AND club_id = ?`,
      [pricingId, id]
    ) as any[];

    if (pricing.length === 0) {
      return NextResponse.json({ error: 'Pricing not found' }, { status: 404 });
    }

    return NextResponse.json({ pricing: pricing[0] });
  } catch (error: any) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 });
  }
}

// PUT - обновить цену
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pricingId: string }> }
) {
  try {
    const { id, pricingId } = await params;
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
    await pool.execute(
      `UPDATE pricing
       SET type = ?, name = ?, description = ?, price = ?, currency = ?, time_slot_start = ?, time_slot_end = ?, day_of_week = ?, is_active = ?, updated_at = NOW()
       WHERE id = ? AND club_id = ?`,
      [
        type,
        name,
        description || null,
        parseFloat(price),
        currency || 'EUR',
        timeSlotStart || null,
        timeSlotEnd || null,
        dayOfWeek || null,
        isActive !== undefined ? isActive : true,
        pricingId,
        id,
      ]
    );

    const currentUser = await findUserById(session.userId);

    await logAction('update', 'pricing', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: pricingId,
      details: { clubId: id, type, name, price, currency },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating pricing:', error);
    return NextResponse.json({ error: 'Failed to update pricing' }, { status: 500 });
  }
}

// DELETE - удалить цену
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pricingId: string }> }
) {
  try {
    const { id, pricingId } = await params;
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

    const pool = getDbPool();
    
    const [pricing] = await pool.execute(
      'SELECT name FROM pricing WHERE id = ? AND club_id = ?',
      [pricingId, id]
    ) as any[];

    if (pricing.length === 0) {
      return NextResponse.json({ error: 'Pricing not found' }, { status: 404 });
    }

    await pool.execute('DELETE FROM pricing WHERE id = ? AND club_id = ?', [pricingId, id]);

    const currentUser = await findUserById(session.userId);

    await logAction('delete', 'pricing', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: pricingId,
      details: { clubId: id, name: pricing[0].name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting pricing:', error);
    return NextResponse.json({ error: 'Failed to delete pricing' }, { status: 500 });
  }
}

