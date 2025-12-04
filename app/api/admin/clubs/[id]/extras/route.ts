import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';
import { checkClubAccessFromSession } from '@/lib/club-access';

export const dynamic = 'force-dynamic';

// GET - получить список дополнительных услуг клуба
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
    const [extras] = await pool.execute(
      `SELECT id, club_id, name, description, price, currency, is_active, created_at, updated_at
       FROM extras
       WHERE club_id = ?
       ORDER BY name ASC`,
      [id]
    ) as any[];

    return NextResponse.json({ extras });
  } catch (error: any) {
    console.error('Error fetching extras:', error);
    return NextResponse.json({ error: 'Failed to fetch extras' }, { status: 500 });
  }
}

// POST - создать новую дополнительную услугу
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
      return NextResponse.json({ error: 'Forbidden. You do not have access to manage extras for this club.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, price, currency, isActive } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Extra name and price are required' }, { status: 400 });
    }

    const pool = getDbPool();
    
    const [clubs] = await pool.execute('SELECT name FROM clubs WHERE id = ?', [id]) as any[];
    if (clubs.length === 0) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const [result] = await pool.execute(
      `INSERT INTO extras (club_id, name, description, price, currency, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        name,
        description || null,
        parseFloat(price),
        currency || 'EUR',
        isActive !== undefined ? isActive : true,
      ]
    ) as any[];

    const extraId = (result as any).insertId;

    const currentUser = await findUserById(session.userId);

    await logAction('create', 'extra', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: extraId,
      details: { clubId: id, clubName: clubs[0].name, name, price, currency },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true, extraId });
  } catch (error: any) {
    console.error('Error creating extra:', error);
    return NextResponse.json({ error: 'Failed to create extra' }, { status: 500 });
  }
}

