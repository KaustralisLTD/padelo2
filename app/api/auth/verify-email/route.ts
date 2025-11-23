import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/users';
import { sendWelcomeEmail } from '@/lib/email';
import { createSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const result = await verifyEmail(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to verify email' },
        { status: 400 }
      );
    }

    if (!result.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Send welcome email - get locale and temporary password from user's data
    const pool = getDbPool();
    let locale = 'en'; // Default fallback
    let temporaryPassword: string | null = null;
    
    try {
      const [users] = await pool.execute(
        'SELECT preferred_language, temporary_password FROM users WHERE id = ?',
        [result.user.id]
      ) as any[];
      if (users.length > 0) {
        if (users[0].preferred_language) {
          locale = users[0].preferred_language;
          console.log(`[verify-email] Using user preferred language: ${locale}`);
        }
        temporaryPassword = users[0].temporary_password || null;
        if (temporaryPassword) {
          console.log(`[verify-email] Found temporary password for user ${result.user.id}`);
        }
      }
      
      if (!locale || locale === 'en') {
        // Fallback: try URL locale
        const url = new URL(request.url);
        const localeFromUrl = url.pathname.split('/')[1];
        if (localeFromUrl && ['en', 'ru', 'ua', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'].includes(localeFromUrl)) {
          locale = localeFromUrl;
          console.log(`[verify-email] Using URL locale: ${locale}`);
        } else {
          // Final fallback: accept-language header
          locale = request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] || 'en';
          console.log(`[verify-email] Using accept-language header: ${locale}`);
        }
      }
    } catch (e) {
      console.error('[verify-email] Error getting user data:', e);
      // Fallback to accept-language header
      locale = request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] || 'en';
    }
    
    console.log(`[verify-email] Sending welcome email to ${result.user.email} with locale: ${locale}${temporaryPassword ? ' (with temporary password)' : ' (NO temporary password)'}`);
    console.log(`[verify-email] Temporary password value: ${temporaryPassword ? temporaryPassword.substring(0, 3) + '...' : 'null/undefined'}`);
    await sendWelcomeEmail(result.user.email, result.user.firstName, locale, temporaryPassword || undefined);
    
    // Clear temporary password after sending welcome email
    if (temporaryPassword) {
      try {
        await pool.execute(
          'UPDATE users SET temporary_password = NULL WHERE id = ?',
          [result.user.id]
        );
        console.log(`[verify-email] Cleared temporary password for user ${result.user.id}`);
      } catch (e) {
        console.error('[verify-email] Error clearing temporary password:', e);
      }
    }

    // Create session for verified user
    const sessionToken = await createSession(result.user.id, 7); // 7 days

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. Welcome to PadelO2!',
      token: sessionToken,
      user: result.user,
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}

