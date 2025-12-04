import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

// GET - получить список пользователей с доступом к клубу
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
    const [accesses] = await pool.execute(
      `SELECT uca.id, uca.user_id, uca.role, uca.created_at,
              u.email, u.first_name, u.last_name, u.role as user_role
       FROM user_club_access uca
       JOIN users u ON uca.user_id = u.id
       WHERE uca.club_id = ?
       ORDER BY uca.created_at DESC`,
      [id]
    ) as any[];

    return NextResponse.json({ accesses });
  } catch (error: any) {
    console.error('Error fetching club access:', error);
    return NextResponse.json({ error: 'Failed to fetch club access' }, { status: 500 });
  }
}

// POST - назначить доступ пользователю к клубу
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
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. Only superadmin can assign club access.' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    if (!['admin', 'manager', 'staff', 'coach'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const pool = getDbPool();
    
    // Проверяем, существует ли клуб
    const [clubs] = await pool.execute('SELECT name FROM clubs WHERE id = ?', [id]) as any[];
    if (clubs.length === 0) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Проверяем, существует ли пользователь
    const [users] = await pool.execute('SELECT email, first_name, last_name FROM users WHERE id = ?', [userId]) as any[];
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Добавляем доступ (или обновляем, если уже существует)
    try {
      await pool.execute(
        `INSERT INTO user_club_access (user_id, club_id, role, created_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE role = ?, updated_at = NOW()`,
        [userId, id, role, role]
      );
    } catch (e: any) {
      // Если ошибка не связана с дубликатом, пробрасываем дальше
      if (!e.message.includes('Duplicate')) {
        throw e;
      }
    }

    // Получаем email текущего пользователя для логирования
    const currentUser = await findUserById(session.userId);

    // Логируем назначение доступа
    await logAction('assign_access', 'club', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: id,
      details: {
        clubName: clubs[0].name,
        assignedUserId: userId,
        assignedUserEmail: users[0].email,
        assignedUserName: `${users[0].first_name} ${users[0].last_name}`,
        role,
      },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error assigning club access:', error);
    return NextResponse.json({ error: 'Failed to assign club access' }, { status: 500 });
  }
}

// DELETE - удалить доступ пользователя к клубу
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
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. Only superadmin can remove club access.' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    const pool = getDbPool();
    
    // Получаем информацию для логирования
    const [clubs] = await pool.execute('SELECT name FROM clubs WHERE id = ?', [id]) as any[];
    const [users] = await pool.execute('SELECT email, first_name, last_name FROM users WHERE id = ?', [userId]) as any[];

    await pool.execute(
      'DELETE FROM user_club_access WHERE user_id = ? AND club_id = ? AND role = ?',
      [userId, id, role]
    );

    // Получаем email текущего пользователя для логирования
    const currentUser = await findUserById(session.userId);

    // Логируем удаление доступа
    if (clubs.length > 0 && users.length > 0) {
      await logAction('remove_access', 'club', {
        userId: session.userId,
        userEmail: currentUser?.email,
        userRole: session.role,
        entityId: id,
        details: {
          clubName: clubs[0].name,
          removedUserId: userId,
          removedUserEmail: users[0].email,
          removedUserName: `${users[0].first_name} ${users[0].last_name}`,
          role,
        },
        ipAddress: getIpAddress(request),
        userAgent: getUserAgent(request),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing club access:', error);
    return NextResponse.json({ error: 'Failed to remove club access' }, { status: 500 });
  }
}

