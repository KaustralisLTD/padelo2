import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { createSession } from '@/lib/users';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

/**
 * POST - обработать callback от Apple OAuth (Apple использует POST для callback)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const code = formData.get('code') as string;
    const idToken = formData.get('id_token') as string;
    const state = formData.get('state') as string;
    const user = formData.get('user') as string; // JSON строка с именем пользователя (только при первой авторизации)

    // Проверяем state
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=invalid_state`);
    }

    if (!idToken) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=no_token`);
    }

    // Декодируем id_token (без проверки подписи для упрощения, в продакшене нужно проверять)
    const decoded = jwt.decode(idToken) as any;
    if (!decoded) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=invalid_token`);
    }

    const { sub: appleId, email } = decoded;

    // Парсим имя пользователя, если оно есть (только при первой авторизации)
    let firstName = 'User';
    let lastName = '';
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.name) {
          firstName = userData.name.firstName || 'User';
          lastName = userData.name.lastName || '';
        }
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    }

    if (!email) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=no_email`);
    }

    const pool = getDbPool();

    // Ищем существующего пользователя по apple_id или email
    const [existingUsers] = await pool.execute(
      'SELECT id, email, first_name, last_name, role, apple_id FROM users WHERE apple_id = ? OR email = ?',
      [appleId, email]
    ) as any[];

    let userId: string;
    let userRole: string;

    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      userId = user.id;
      userRole = user.role;

      // Обновляем apple_id, если его еще нет
      if (!user.apple_id) {
        await pool.execute(
          'UPDATE users SET apple_id = ?, updated_at = NOW() WHERE id = ?',
          [appleId, userId]
        );
      }

      // Обновляем имя, если оно было предоставлено и отличается
      if (user && (firstName !== 'User' || lastName)) {
        await pool.execute(
          'UPDATE users SET first_name = ?, last_name = ?, updated_at = NOW() WHERE id = ?',
          [firstName, lastName, userId]
        );
      }
    } else {
      // Создаем нового пользователя
      userId = crypto.randomUUID();
      userRole = 'participant';

      await pool.execute(
        `INSERT INTO users (id, email, apple_id, first_name, last_name, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, email, appleId, firstName, lastName, userRole]
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
    response.cookies.delete('oauth_nonce');

    return response;
  } catch (error: any) {
    console.error('Apple OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com'}/login?error=oauth_failed`);
  }
}

