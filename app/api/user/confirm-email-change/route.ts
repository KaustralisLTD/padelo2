import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Find user with this confirm token
    const [users] = await pool.execute(
      'SELECT id, email, email_change_new_email, email_change_requested_at FROM users WHERE email_change_confirm_token = ?',
      [token]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    const user = users[0];

    // Check if request is not too old (e.g., 7 days)
    if (user.email_change_requested_at) {
      const requestedAt = new Date(user.email_change_requested_at);
      const now = new Date();
      const daysDiff = (now.getTime() - requestedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 7) {
        // Clear expired request
        await pool.execute(
          'UPDATE users SET email_change_new_email = NULL, email_change_cancel_token = NULL, email_change_confirm_token = NULL, email_change_requested_at = NULL WHERE id = ?',
          [user.id]
        );
        return NextResponse.json(
          { error: 'Email change request has expired' },
          { status: 400 }
        );
      }
    }

    if (!user.email_change_new_email) {
      return NextResponse.json(
        { error: 'No email change request found' },
        { status: 400 }
      );
    }

    // Check if new email is already in use
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [user.email_change_new_email, user.id]
    ) as any[];

    if (existingUsers.length > 0) {
      // Clear the request
      await pool.execute(
        'UPDATE users SET email_change_new_email = NULL, email_change_cancel_token = NULL, email_change_confirm_token = NULL, email_change_requested_at = NULL WHERE id = ?',
        [user.id]
      );
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 400 }
      );
    }

    const oldEmail = user.email;

    // Update email and clear change request
    await pool.execute(
      `UPDATE users 
       SET email = ?, 
           email_change_new_email = NULL, 
           email_change_cancel_token = NULL, 
           email_change_confirm_token = NULL, 
           email_change_requested_at = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [user.email_change_new_email, user.id]
    );

    // Логируем подтверждение изменения email
    const updatedUser = await findUserById(user.id);
    await logAction('confirm_email_change', 'user', {
      userId: user.id,
      userEmail: oldEmail,
      userRole: updatedUser?.role,
      entityId: user.id,
      details: { oldEmail, newEmail: user.email_change_new_email },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {}); // Игнорируем ошибки логирования

    return NextResponse.json({
      success: true,
      message: 'Email changed successfully',
      newEmail: user.email_change_new_email,
    });
  } catch (error: any) {
    console.error('Error confirming email change:', error);
    return NextResponse.json(
      { error: 'Failed to confirm email change' },
      { status: 500 }
    );
  }
}

