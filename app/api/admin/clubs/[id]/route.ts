import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';
import { checkClubAccessFromSession } from '@/lib/club-access';

export const dynamic = 'force-dynamic';

// GET - получить информацию о клубе
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

    const pool = getDbPool();
    const [clubs] = await pool.execute(
      'SELECT id, name, address, description, location, working_hours, created_at, updated_at FROM clubs WHERE id = ?',
      [id]
    ) as any[];

    if (clubs.length === 0) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const club = clubs[0];
    if (club.working_hours && typeof club.working_hours === 'string') {
      try {
        club.working_hours = JSON.parse(club.working_hours);
      } catch (e) {
        club.working_hours = null;
      }
    }

    return NextResponse.json({ club });
  } catch (error: any) {
    console.error('Error fetching club:', error);
    return NextResponse.json({ error: 'Failed to fetch club' }, { status: 500 });
  }
}

// PUT - обновить клуб
export async function PUT(
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
    if (!access.authorized) {
      return NextResponse.json({ error: 'Forbidden. You do not have access to update this club.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, description, location, workingHours } = body;

    if (!name) {
      return NextResponse.json({ error: 'Club name is required' }, { status: 400 });
    }

    const pool = getDbPool();
    await pool.execute(
      `UPDATE clubs 
       SET name = ?, address = ?, description = ?, location = ?, working_hours = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        address || null,
        description || null,
        location || null,
        workingHours ? JSON.stringify(workingHours) : null,
        id,
      ]
    );

    // Логируем обновление клуба
    await logAction('update', 'club', {
      userId: session.userId,
      userEmail: (await findUserById(session.userId))?.email,
      userRole: session.role,
      entityId: id,
      details: { name, address, location },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating club:', error);
    return NextResponse.json({ error: 'Failed to update club' }, { status: 500 });
  }
}

// DELETE - удалить клуб
export async function DELETE(
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
    
    // Только суперадмин может удалять клубы
    if (session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. Only superadmin can delete clubs.' }, { status: 403 });
    }

    const pool = getDbPool();
    
    // Получаем информацию о клубе перед удалением для логирования
    const [clubs] = await pool.execute(
      'SELECT name FROM clubs WHERE id = ?',
      [id]
    ) as any[];

    if (clubs.length === 0) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    await pool.execute('DELETE FROM clubs WHERE id = ?', [id]);

    // Логируем удаление клуба
    await logAction('delete', 'club', {
      userId: session.userId,
      userEmail: (await findUserById(session.userId))?.email,
      userRole: session.role,
      entityId: id,
      details: { name: clubs[0].name },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting club:', error);
    return NextResponse.json({ error: 'Failed to delete club' }, { status: 500 });
  }
}

