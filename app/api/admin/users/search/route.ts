import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/users';
import { getSession } from '@/lib/users';
import { UserRole } from '@/lib/auth';

async function checkAdminAccess(request: NextRequest): Promise<{ authorized: boolean }> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

  if (!token) {
    return { authorized: false };
  }

  const session = await getSession(token);
  if (!session || session.role !== 'superadmin') {
    return { authorized: false };
  }

  return { authorized: true };
}

export async function GET(request: NextRequest) {
  const access = await checkAdminAccess(request);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const allUsers = await getAllUsers();
    
    // Фильтруем активных пользователей (с верифицированным email)
    const activeUsers = allUsers.filter(user => 
      user.emailVerified !== false
    );

    // Поиск по имени, фамилии или email
    let filteredUsers = activeUsers;
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      filteredUsers = activeUsers.filter(user => 
        (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchLower)
      );
    }

    // Ограничиваем количество результатов
    const limitedUsers = filteredUsers.slice(0, limit);

    return NextResponse.json({ 
      users: limitedUsers.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      }))
    });
  } catch (error: any) {
    console.error('Error searching users:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

