import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';
import { checkClubAccessFromSession } from '@/lib/club-access';

export const dynamic = 'force-dynamic';

// GET - получить список кортов клуба
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
    
    // Проверяем доступ: суперадмин или пользователь с доступом к этому клубу
    const access = await checkClubAccessFromSession(token, parseInt(id));
    if (!access.authorized && session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. You do not have access to this club.' }, { status: 403 });
    }

    const pool = getDbPool();
    const [courts] = await pool.execute(
      `SELECT id, club_id, name, description, location, type, working_hours, is_active, created_at, updated_at
       FROM courts
       WHERE club_id = ?
       ORDER BY name ASC`,
      [id]
    ) as any[];

    // Парсим working_hours если это строка
    const courtsWithParsedHours = courts.map((court: any) => {
      if (court.working_hours && typeof court.working_hours === 'string') {
        try {
          court.working_hours = JSON.parse(court.working_hours);
        } catch (e) {
          court.working_hours = null;
        }
      }
      return court;
    });

    return NextResponse.json({ courts: courtsWithParsedHours });
  } catch (error: any) {
    console.error('Error fetching courts:', error);
    return NextResponse.json({ error: 'Failed to fetch courts' }, { status: 500 });
  }
}

// POST - создать новый корт
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
    
    // Проверяем доступ: суперадмин или админ этого клуба
    const access = await checkClubAccessFromSession(token, parseInt(id), 'admin');
    if (!access.authorized && session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. You do not have access to manage courts for this club.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, location, type, workingHours, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: 'Court name is required' }, { status: 400 });
    }

    const pool = getDbPool();
    
    // Проверяем, существует ли клуб
    const [clubs] = await pool.execute('SELECT name FROM clubs WHERE id = ?', [id]) as any[];
    if (clubs.length === 0) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const [result] = await pool.execute(
      `INSERT INTO courts (club_id, name, description, location, type, working_hours, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        name,
        description || null,
        location || null,
        type || 'outdoor',
        workingHours ? JSON.stringify(workingHours) : null,
        isActive !== undefined ? isActive : true,
      ]
    ) as any[];

    const courtId = (result as any).insertId;

    // Получаем email текущего пользователя для логирования
    const currentUser = await findUserById(session.userId);

    // Логируем создание корта
    await logAction('create', 'court', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: courtId,
      details: { clubId: id, clubName: clubs[0].name, name, type },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true, courtId });
  } catch (error: any) {
    console.error('Error creating court:', error);
    return NextResponse.json({ error: 'Failed to create court' }, { status: 500 });
  }
}

