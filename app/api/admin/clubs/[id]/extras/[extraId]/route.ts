import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';
import { checkClubAccessFromSession } from '@/lib/club-access';

export const dynamic = 'force-dynamic';

// GET - получить информацию об услуге
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; extraId: string }> }
) {
  try {
    const { id, extraId } = await params;
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
    const [extras] = await pool.execute(
      `SELECT id, club_id, name, description, price, currency, is_active, created_at, updated_at
       FROM extras
       WHERE id = ? AND club_id = ?`,
      [extraId, id]
    ) as any[];

    if (extras.length === 0) {
      return NextResponse.json({ error: 'Extra not found' }, { status: 404 });
    }

    return NextResponse.json({ extra: extras[0] });
  } catch (error: any) {
    console.error('Error fetching extra:', error);
    return NextResponse.json({ error: 'Failed to fetch extra' }, { status: 500 });
  }
}

// PUT - обновить услугу
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; extraId: string }> }
) {
  try {
    const { id, extraId } = await params;
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
      return NextResponse.json({ error: 'Forbidden. You do not have access to manage extras for this club.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, currency, isActive } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Extra name and price are required' }, { status: 400 });
    }

    const pool = getDbPool();
    await pool.execute(
      `UPDATE extras
       SET name = ?, description = ?, price = ?, currency = ?, is_active = ?, updated_at = NOW()
       WHERE id = ? AND club_id = ?`,
      [
        name,
        description || null,
        parseFloat(price),
        currency || 'EUR',
        isActive !== undefined ? isActive : true,
        extraId,
        id,
      ]
    );

    const currentUser = await findUserById(session.userId);

    await logAction('update', 'extra', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: extraId,
      details: { clubId: id, name, price, currency },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating extra:', error);
    return NextResponse.json({ error: 'Failed to update extra' }, { status: 500 });
  }
}

// DELETE - удалить услугу
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; extraId: string }> }
) {
  try {
    const { id, extraId } = await params;
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
      return NextResponse.json({ error: 'Forbidden. You do not have access to manage extras for this club.' }, { status: 403 });
    }

    const pool = getDbPool();
    
    const [extras] = await pool.execute(
      'SELECT name FROM extras WHERE id = ? AND club_id = ?',
      [extraId, id]
    ) as any[];

    if (extras.length === 0) {
      return NextResponse.json({ error: 'Extra not found' }, { status: 404 });
    }

    await pool.execute('DELETE FROM extras WHERE id = ? AND club_id = ?', [extraId, id]);

    const currentUser = await findUserById(session.userId);

    await logAction('delete', 'extra', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: extraId,
      details: { clubId: id, name: extras[0].name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting extra:', error);
    return NextResponse.json({ error: 'Failed to delete extra' }, { status: 500 });
  }
}

