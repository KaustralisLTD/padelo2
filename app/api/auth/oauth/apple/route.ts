import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

/**
 * GET - инициировать OAuth авторизацию Apple
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.APPLE_CLIENT_ID;
    const redirectUri = process.env.APPLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/api/auth/oauth/apple/callback`;
    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_KEY_ID;
    const privateKey = process.env.APPLE_PRIVATE_KEY;

    if (!clientId || !teamId || !keyId || !privateKey) {
      return NextResponse.json(
        { error: 'Apple OAuth not configured' },
        { status: 500 }
      );
    }

    // Генерируем client secret (JWT)
    const now = Math.floor(Date.now() / 1000);
    const clientSecret = jwt.sign(
      {
        iss: teamId,
        iat: now,
        exp: now + 3600, // 1 час
        aud: 'https://appleid.apple.com',
        sub: clientId,
      },
      privateKey.replace(/\\n/g, '\n'),
      {
        algorithm: 'ES256',
        keyid: keyId,
      }
    );

    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');

    const authUrl = `https://appleid.apple.com/auth/authorize?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code id_token',
      scope: 'name email',
      state,
      nonce,
      response_mode: 'form_post',
    })}`;

    // Сохраняем state и nonce в cookie
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    });
    response.cookies.set('oauth_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    });

    return response;
  } catch (error: any) {
    console.error('Apple OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Apple OAuth' },
      { status: 500 }
    );
  }
}

