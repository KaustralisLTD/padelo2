import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';
import { checkClubAccessFromSession } from '@/lib/club-access';

export const dynamic = 'force-dynamic';

// GET - получить информацию о корте
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; courtId: string }> }
) {
  try {
    const { id, courtId } = await params;
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
       WHERE id = ? AND club_id = ?`,
      [courtId, id]
    ) as any[];

    if (courts.length === 0) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    const court = courts[0];
    if (court.working_hours && typeof court.working_hours === 'string') {
      try {
        court.working_hours = JSON.parse(court.working_hours);
      } catch (e) {
        court.working_hours = null;
      }
    }

    return NextResponse.json({ court });
  } catch (error: any) {
    console.error('Error fetching court:', error);
    return NextResponse.json({ error: 'Failed to fetch court' }, { status: 500 });
  }
}

// PUT - обновить корт
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; courtId: string }> }
) {
  try {
    const { id, courtId } = await params;
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
    await pool.execute(
      `UPDATE courts
       SET name = ?, description = ?, location = ?, type = ?, working_hours = ?, is_active = ?, updated_at = NOW()
       WHERE id = ? AND club_id = ?`,
      [
        name,
        description || null,
        location || null,
        type || 'outdoor',
        workingHours ? JSON.stringify(workingHours) : null,
        isActive !== undefined ? isActive : true,
        courtId,
        id,
      ]
    );

    // Получаем email текущего пользователя для логирования
    const currentUser = await findUserById(session.userId);

    // Логируем обновление корта
    await logAction('update', 'court', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: courtId,
      details: { clubId: id, name, type },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating court:', error);
    return NextResponse.json({ error: 'Failed to update court' }, { status: 500 });
  }
}

// DELETE - удалить корт
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; courtId: string }> }
) {
  try {
    const { id, courtId } = await params;
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

    const pool = getDbPool();
    
    // Получаем информацию о корте для логирования
    const [courts] = await pool.execute(
      'SELECT name FROM courts WHERE id = ? AND club_id = ?',
      [courtId, id]
    ) as any[];

    if (courts.length === 0) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 });
    }

    await pool.execute('DELETE FROM courts WHERE id = ? AND club_id = ?', [courtId, id]);

    // Получаем email текущего пользователя для логирования
    const currentUser = await findUserById(session.userId);

    // Логируем удаление корта
    await logAction('delete', 'court', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: courtId,
      details: { clubId: id, name: courts[0].name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting court:', error);
    return NextResponse.json({ error: 'Failed to delete court' }, { status: 500 });
  }
}

