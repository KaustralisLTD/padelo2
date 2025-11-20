import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { createSession } from '@/lib/users';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET - инициировать OAuth авторизацию Google
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/api/auth/oauth/google/callback`;
    const scope = 'openid email profile';

    if (!clientId) {
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    const state = crypto.randomBytes(32).toString('hex');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      state,
      access_type: 'offline',
      prompt: 'consent',
    })}`;

    // Сохраняем state в cookie для проверки
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 минут
    });

    return response;
  } catch (error: any) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth' },
      { status: 500 }
    );
  }
}

