import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSession, getSession, initializeDefaultAdmin, findUserByEmail } from '@/lib/users';
import { initDatabase } from '@/lib/db';
import { logAction } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

// Initialize database and default admin on first import
let initialized = false;
async function ensureInitialized() {
  if (initialized) return;
  try {
    await initDatabase();
    await initializeDefaultAdmin();
    initialized = true;
    console.log('✅ Database and admin initialization completed');
  } catch (error: any) {
    console.error('❌ Database initialization error:', error.message);
    // Still try to initialize admin in memory
    try {
      await initializeDefaultAdmin();
    } catch (adminError) {
      console.error('❌ Admin initialization error:', adminError);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Verify password and get user
    let user = await verifyPassword(email, password);

    // Fallback для админа (только если стандартная проверка не сработала)
    if (!user && email === 'admin@padelo2.com' && password === 'admin123') {
      // Попробуем инициализировать админа и повторить проверку
      await initializeDefaultAdmin();
      user = await verifyPassword(email, password);
      
      // Если все еще не найден, попробуем создать напрямую
      if (!user) {
        try {
          const { createUser } = await import('@/lib/users');
          user = await createUser({
            email: 'admin@padelo2.com',
            password: 'admin123',
            firstName: 'Super',
            lastName: 'Admin',
            role: 'superadmin',
          });
        } catch (error: any) {
          // Игнорируем ошибки создания
        }
      }
    }

    if (!user) {
      // Логируем неудачную попытку входа (асинхронно, не блокируем ответ)
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';
      logAction('login', 'user', {
        userEmail: email,
        details: { success: false, error: 'Invalid credentials' },
        ipAddress,
        userAgent,
      }).catch(() => {}); // Игнорируем ошибки логирования

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session
    const token = await createSession(user.id, 7); // 7 days

    // Логируем успешный вход (асинхронно, не блокируем ответ)
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    logAction('login', 'user', {
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      entityId: user.id,
      details: { success: true },
      ipAddress,
      userAgent,
    }).catch(() => {}); // Игнорируем ошибки логирования

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error.message || error);
    console.error('[Auth] Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to login',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureInitialized();
    
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 401 }
      );
    }

    const session = await getSession(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      session: {
        userId: session.userId,
        role: session.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}


