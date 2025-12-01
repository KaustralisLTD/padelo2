import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser, updateUser, deleteUser, findUserById } from '@/lib/users';
import { getSession } from '@/lib/users';
import { UserRole } from '@/lib/auth';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';

// Helper to check if user is admin
async function checkAdminAccess(request: NextRequest): Promise<{ authorized: boolean; userId?: string; role?: UserRole }> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return { authorized: false };
  }

  const session = await getSession(token);
  if (!session) {
    return { authorized: false };
  }

  // Only superadmin can access admin endpoints
  if (session.role !== 'superadmin') {
    return { authorized: false };
  }

  return { authorized: true, userId: session.userId, role: session.role };
}

// GET - Get all users
export async function GET(request: NextRequest) {
  try {
    const access = await checkAdminAccess(request);
    if (!access.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const access = await checkAdminAccess(request);
    if (!access.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, password, firstName, lastName, role } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: UserRole[] = ['superadmin', 'tournament_admin', 'manager', 'coach', 'staff', 'participant'];
    const userRole = role && validRoles.includes(role) ? role : 'participant';

    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
      role: userRole,
    });

    // Логируем создание пользователя
    const adminUser = await findUserById(access.userId!);
    await logAction('create', 'user', {
      userId: access.userId,
      userEmail: adminUser?.email,
      userRole: access.role,
      entityId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {}); // Игнорируем ошибки логирования

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.message === 'User with this email already exists') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const access = await checkAdminAccess(request);
    if (!access.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, email, password, firstName, lastName, role } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await findUserById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Validate password length if provided
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate role if provided
    let userRole: UserRole | undefined;
    if (role) {
      const validRoles: UserRole[] = ['superadmin', 'tournament_admin', 'manager', 'coach', 'staff', 'participant'];
      if (validRoles.includes(role)) {
        userRole = role;
      }
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (userRole) updateData.role = userRole;

    const updatedUser = await updateUser(id, updateData);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Логируем обновление пользователя
    const adminUser = await findUserById(access.userId!);
    await logAction('update', 'user', {
      userId: access.userId,
      userEmail: adminUser?.email,
      userRole: access.role,
      entityId: updatedUser.id,
      details: { email: updatedUser.email, updatedFields: Object.keys(updateData) },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {}); // Игнорируем ошибки логирования

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.message === 'User with this email already exists') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const access = await checkAdminAccess(request);
    if (!access.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await findUserById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting yourself
    if (user.id === access.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const deleted = await deleteUser(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // Логируем удаление пользователя
    const adminUser = await findUserById(access.userId!);
    await logAction('delete', 'user', {
      userId: access.userId,
      userEmail: adminUser?.email,
      userRole: access.role,
      entityId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {}); // Игнорируем ошибки логирования

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

