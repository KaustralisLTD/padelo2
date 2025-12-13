import { NextRequest, NextResponse } from 'next/server';
import { updateUser, findUserById } from '@/lib/users';
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

// GET - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkAdminAccess(request);
    if (!access.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const user = await findUserById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error: any) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

// PUT - Update user by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await checkAdminAccess(request);
    if (!access.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { email, password, firstName, lastName, role } = body;

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
      } else {
        console.warn(`[Admin Users] Invalid role provided: ${role}, valid roles: ${validRoles.join(', ')}`);
      }
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    // Всегда обновляем роль, если она указана
    if (userRole !== undefined) {
      updateData.role = userRole;
      console.log(`[Admin Users] Updating role to: ${userRole} for user: ${id}`);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    console.log(`[Admin Users API] Calling updateUser with:`, { id, updateData });
    const updatedUser = await updateUser(id, updateData, true); // true = sendRoleChangeEmail

    if (!updatedUser) {
      console.error(`[Admin Users API] updateUser returned null for user: ${id}`);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    console.log(`[Admin Users API] User updated successfully:`, { id, role: updatedUser.role });

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
        emailVerified: updatedUser.emailVerified,
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

