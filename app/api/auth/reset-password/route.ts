import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Find user with this reset token
    const [users] = await pool.execute(
      `SELECT id, email, password_reset_expires 
       FROM users 
       WHERE password_reset_token = ?`,
      [token]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const user = users[0];

    // Check if token is expired
    if (user.password_reset_expires) {
      const expiresAt = new Date(user.password_reset_expires);
      const now = new Date();
      
      if (now > expiresAt) {
        // Clear expired token
        await pool.execute(
          'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
          [user.id]
        );
        return NextResponse.json(
          { error: 'Reset token has expired. Please request a new password reset link.' },
          { status: 400 }
        );
      }
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await pool.execute(
      `UPDATE users 
       SET password_hash = ?, 
           password_reset_token = NULL, 
           password_reset_expires = NULL,
           updated_at = NOW() 
       WHERE id = ?`,
      [passwordHash, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error: any) {
    console.error('[Auth] Reset password error:', error.message || error);
    return NextResponse.json(
      { 
        error: 'Failed to reset password',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

