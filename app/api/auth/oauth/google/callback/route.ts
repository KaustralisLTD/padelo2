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
      userRole = user.role || 'participant'; // Устанавливаем роль по умолчанию, если отсутствует

      // Если роль отсутствует, устанавливаем её
      if (!user.role) {
        console.warn(`[OAuth] User ${userId} exists but has no role, setting default 'participant'`);
        await pool.execute(
          'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
          ['participant', userId]
        );
        userRole = 'participant';
      }

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
      
      console.log(`[OAuth] Existing user found: id=${userId}, email=${email}, role=${userRole}`);
    } else {
      // Создаем нового пользователя
      userId = crypto.randomUUID();
      userRole = 'participant';

      await pool.execute(
        `INSERT INTO users (id, email, google_id, first_name, last_name, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, email, googleId, firstName || 'User', lastName || '', userRole || 'participant']
      );
      
      // Проверяем, что пользователь создан с ролью
      const [verifyUser] = await pool.execute(
        'SELECT id, role FROM users WHERE id = ?',
        [userId]
      ) as any[];
      
      if (verifyUser.length === 0) {
        console.error(`[OAuth] User creation failed - user not found after INSERT`);
        throw new Error('User creation failed');
      }
      
      if (!verifyUser[0].role) {
        console.warn(`[OAuth] User created without role, setting default 'participant'`);
        await pool.execute(
          'UPDATE users SET role = ? WHERE id = ?',
          ['participant', userId]
        );
        userRole = 'participant';
      }
      
      console.log(`[OAuth] User created: id=${userId}, email=${email}, role=${userRole}`);
    }

    // Создаем сессию
    console.log(`[OAuth] Creating session for user ${userId}`);
    const token = await createSession(userId, 30); // 30 дней для OAuth

    if (!token) {
      console.error('[OAuth] Failed to create session token');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=session_creation_failed`);
    }

    console.log(`[OAuth] Session created successfully, token: ${token.substring(0, 8)}...`);

    // Проверяем, что сессия действительно создана в БД напрямую
    // (getSession может не увидеть только что созданную сессию из-за кеширования или транзакций)
    try {
      const pool = getDbPool();
      const [sessionRows] = await pool.execute(
        `SELECT s.user_id, u.role, s.expires_at
         FROM sessions s 
         LEFT JOIN users u ON s.user_id = u.id 
         WHERE s.token = ? AND s.expires_at > NOW()`,
        [token]
      ) as any[];

      if (sessionRows.length === 0) {
        console.error('[OAuth] Session not found in database after creation');
        // Попробуем еще раз через небольшую задержку (возможно, проблема с репликацией или транзакциями)
        await new Promise(resolve => setTimeout(resolve, 100));
        const [retryRows] = await pool.execute(
          `SELECT s.user_id, u.role, s.expires_at
           FROM sessions s 
           LEFT JOIN users u ON s.user_id = u.id 
           WHERE s.token = ? AND s.expires_at > NOW()`,
          [token]
        ) as any[];
        
        if (retryRows.length === 0) {
          console.error('[OAuth] Session still not found after retry');
          // Не прерываем процесс - возможно, сессия создана, но есть задержка в БД
          // Продолжаем с редиректом, клиент попробует использовать токен
        } else {
          console.log(`[OAuth] Session found on retry, user: ${retryRows[0].user_id}, role: ${retryRows[0].role}`);
        }
      } else {
        console.log(`[OAuth] Session verified in database, user: ${sessionRows[0].user_id}, role: ${sessionRows[0].role}`);
      }
    } catch (verifyError: any) {
      console.error('[OAuth] Error verifying session in database:', verifyError);
      // Не прерываем процесс - продолжаем с редиректом
    }

    // Перенаправляем на dashboard напрямую с токеном в URL
    // Клиент сохранит токен в localStorage и перенаправит на dashboard
    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/${process.env.DEFAULT_LOCALE || 'en'}/login`);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('success', 'true');
    redirectUrl.searchParams.set('oauth', 'true'); // Флаг для OAuth входа

    const response = NextResponse.redirect(redirectUrl.toString());
    response.cookies.delete('oauth_state');
    
    // Также устанавливаем токен в cookie для дополнительной надежности
    response.cookies.set('auth_token', token, {
      httpOnly: false, // Нужно для клиентского доступа
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 дней
      path: '/',
    });

    console.log(`[OAuth] Redirecting to: ${redirectUrl.toString()}`);

    return response;
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=oauth_failed`);
  }
}

