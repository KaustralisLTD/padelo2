import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/users';
import { sendPasswordResetEmail } from '@/lib/email';
import { getDbPool } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await findUserByEmail(email);
    
    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour

    // Store reset token in database
    const pool = getDbPool();
    await pool.execute(
      `UPDATE users 
       SET password_reset_token = ?, password_reset_expires = ? 
       WHERE id = ?`,
      [resetToken, resetTokenExpiry, user.id]
    );

    // Get locale from Accept-Language header or default to 'en'
    const acceptLanguage = request.headers.get('accept-language') || 'en';
    const locale = acceptLanguage.split(',')[0].split('-')[0] || 'en';

    // Send password reset email
    await sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetToken,
      locale
    );

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
    });
  } catch (error: any) {
    console.error('[Auth] Forgot password error:', error.message || error);
    return NextResponse.json(
      { 
        error: 'Failed to process password reset request',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

