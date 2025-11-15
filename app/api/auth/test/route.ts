import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { findUserByEmail, initializeDefaultAdmin } from '@/lib/users';

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      database: {
        configured: !!(process.env.DATABASE_HOST && process.env.DATABASE_USER && process.env.DATABASE_PASSWORD && process.env.DATABASE_NAME),
        host: process.env.DATABASE_HOST || 'not set',
        user: process.env.DATABASE_USER || 'not set',
        database: process.env.DATABASE_NAME || 'not set',
      },
      admin: {
        exists: false,
        email: 'admin@padelo2.com',
      },
      connection: {
        status: 'unknown',
        error: null,
      },
    };

    // Проверяем подключение к БД
    if (results.database.configured) {
      try {
        const pool = getDbPool();
        await pool.execute('SELECT 1');
        results.connection.status = 'connected';
      } catch (error: any) {
        results.connection.status = 'failed';
        results.connection.error = error.message;
      }
    }

    // Проверяем существование админа
    try {
      await initializeDefaultAdmin();
      const adminUser = await findUserByEmail('admin@padelo2.com');
      results.admin.exists = !!adminUser;
      if (adminUser) {
        results.admin.id = adminUser.id;
        results.admin.role = adminUser.role;
      }
    } catch (error: any) {
      results.admin.error = error.message;
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Test failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

