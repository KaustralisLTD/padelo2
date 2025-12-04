import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

// GET - получить список всех клубов
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || (session.role !== 'superadmin' && session.role !== 'tournament_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pool = getDbPool();
    const [clubs] = await pool.execute(
      'SELECT id, name, address, description, location, working_hours, created_at, updated_at FROM clubs ORDER BY name ASC'
    ) as any[];

    return NextResponse.json({ clubs });
  } catch (error: any) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json({ error: 'Failed to fetch clubs' }, { status: 500 });
  }
}

// POST - создать новый клуб
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. Only superadmin can create clubs.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, description, location, workingHours } = body;

    if (!name) {
      return NextResponse.json({ error: 'Club name is required' }, { status: 400 });
    }

    const pool = getDbPool();
    const [result] = await pool.execute(
      `INSERT INTO clubs (name, address, description, location, working_hours, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        name,
        address || null,
        description || null,
        location || null,
        workingHours ? JSON.stringify(workingHours) : null,
      ]
    ) as any[];

    const clubId = (result as any).insertId;

    // Логируем создание клуба
    await logAction('create', 'club', {
      userId: session.userId,
      userEmail: (await findUserById(session.userId))?.email,
      userRole: session.role,
      entityId: clubId,
      details: { name, address, location },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true, clubId });
  } catch (error: any) {
    console.error('Error creating club:', error);
    return NextResponse.json({ error: 'Failed to create club' }, { status: 500 });
  }
}

