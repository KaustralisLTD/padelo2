import { NextRequest, NextResponse } from 'next/server';
import { updateUser, findUserById } from '@/lib/users';
import { getSession } from '@/lib/users';
import { UserRole } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

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

// POST - Manually verify user email
export async function POST(
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
    
    // Check if user exists
    const existingUser = await findUserById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user email verification status
    const updatedUser = await updateUser(id, { emailVerified: true });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
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
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}

