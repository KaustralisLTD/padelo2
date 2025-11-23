import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Get current user and verify current password
    const [users] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [session.userId]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, session.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}

