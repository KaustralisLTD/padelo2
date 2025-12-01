import { NextRequest, NextResponse } from 'next/server';
import { getSession, findUserById } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import { sendChangeEmailOldAddressEmail, sendChangeEmailNewAddressEmail } from '@/lib/email';
import crypto from 'crypto';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';

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
    const { newEmail, password } = body;

    if (!newEmail || !password) {
      return NextResponse.json(
        { error: 'New email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Get current user and verify password
    const [users] = await pool.execute(
      'SELECT email, password_hash, first_name, preferred_language FROM users WHERE id = ?',
      [session.userId]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Verify password
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 400 }
      );
    }

    // Check if new email is already in use
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [newEmail, session.userId]
    ) as any[];

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 400 }
      );
    }

    // Generate tokens for email change
    const cancelToken = crypto.randomBytes(32).toString('hex');
    const confirmToken = crypto.randomBytes(32).toString('hex');

    // Store email change request
    await pool.execute(
      `UPDATE users 
       SET email_change_new_email = ?, 
           email_change_cancel_token = ?, 
           email_change_confirm_token = ?,
           email_change_requested_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [newEmail, cancelToken, confirmToken, session.userId]
    );

    // Get locale
    const locale = user.preferred_language || 'en';

    // Send emails
    try {
      await sendChangeEmailOldAddressEmail(
        user.email,
        newEmail,
        user.first_name || 'User',
        cancelToken,
        locale
      );
      await sendChangeEmailNewAddressEmail(
        newEmail,
        user.first_name || 'User',
        confirmToken,
        locale
      );
    } catch (emailError) {
      console.error('Error sending email change notifications:', emailError);
      // Continue even if email sending fails
    }

    // Логируем запрос на изменение email
    await logAction('change_email', 'user', {
      userId: session.userId,
      userEmail: user.email,
      userRole: session.role,
      entityId: session.userId,
      details: { oldEmail: user.email, newEmail },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {}); // Игнорируем ошибки логирования

    return NextResponse.json({
      success: true,
      message: 'Email change request sent. Please check both email addresses for confirmation.',
    });
  } catch (error: any) {
    console.error('Error requesting email change:', error);
    return NextResponse.json(
      { error: 'Failed to request email change' },
      { status: 500 }
    );
  }
}

