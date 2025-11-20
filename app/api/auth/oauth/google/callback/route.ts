import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { createSession } from '@/lib/users';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET - обработать callback от Google OAuth
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=oauth_cancelled`);
    }

    // Проверяем state
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=invalid_state`);
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=no_code`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/api/auth/oauth/google/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=oauth_not_configured`);
    }

    // Обмениваем код на токен
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Google token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Получаем информацию о пользователе
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Google user info fetch failed:', await userInfoResponse.text());
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=user_info_failed`);
    }

    const userInfo = await userInfoResponse.json();
    const { id: googleId, email, given_name: firstName, family_name: lastName, picture } = userInfo;

    if (!email) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=no_email`);
    }

    const pool = getDbPool();

    // Ищем существующего пользователя по google_id или email
    const [existingUsers] = await pool.execute(
      'SELECT id, email, first_name, last_name, role, google_id FROM users WHERE google_id = ? OR email = ?',
      [googleId, email]
    ) as any[];

    let userId: string;
    let userRole: string;

    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      userId = user.id;
      userRole = user.role;

      // Обновляем google_id, если его еще нет
      if (!user.google_id) {
        await pool.execute(
          'UPDATE users SET google_id = ?, updated_at = NOW() WHERE id = ?',
          [googleId, userId]
        );
      }

      // Обновляем имя, если оно изменилось
      if (firstName && lastName) {
        await pool.execute(
          'UPDATE users SET first_name = ?, last_name = ?, updated_at = NOW() WHERE id = ?',
          [firstName, lastName || '', userId]
        );
      }
    } else {
      // Создаем нового пользователя
      userId = crypto.randomUUID();
      userRole = 'participant';

      await pool.execute(
        `INSERT INTO users (id, email, google_id, first_name, last_name, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, email, googleId, firstName || 'User', lastName || '', userRole]
      );
    }

    // Создаем сессию
    const token = await createSession(userId, 30); // 30 дней для OAuth

    // Перенаправляем на главную страницу с токеном
    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login`);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('success', 'true');

    const response = NextResponse.redirect(redirectUrl.toString());
    response.cookies.delete('oauth_state');

    return response;
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=oauth_failed`);
  }
}

