import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { initializeDefaultAdmin } from '@/lib/users';

export const dynamic = 'force-dynamic';

/**
 * GET - проверить подключение к БД и статус админа
 */
export async function GET() {
  try {
    // Проверяем переменные окружения
    const hasDbConfig = !!(
      process.env.DATABASE_HOST &&
      process.env.DATABASE_USER &&
      process.env.DATABASE_PASSWORD &&
      process.env.DATABASE_NAME
    );

    if (!hasDbConfig) {
      return NextResponse.json({
        database_configured: false,
        message: 'Database environment variables not set',
        required_vars: [
          'DATABASE_HOST',
          'DATABASE_USER',
          'DATABASE_PASSWORD',
          'DATABASE_NAME'
        ],
        hint: 'Add these variables in Vercel Dashboard → Settings → Environment Variables'
      });
    }

    // Пытаемся подключиться к БД
    try {
      const pool = getDbPool();
      
      // Простой тестовый запрос
      await pool.execute('SELECT 1 as test');
      
      // Проверяем, существует ли админ
      const [adminCheck] = await pool.execute(
        'SELECT id, email, role FROM users WHERE email = ?',
        ['admin@padelo2.com']
      ) as any[];

      // Если админа нет, пытаемся создать
      if (adminCheck.length === 0) {
        try {
          await initializeDefaultAdmin();
          const [newAdminCheck] = await pool.execute(
            'SELECT id, email, role FROM users WHERE email = ?',
            ['admin@padelo2.com']
          ) as any[];
          
          return NextResponse.json({
            database_configured: true,
            database_connected: true,
            admin_exists: newAdminCheck.length > 0,
            admin_created: newAdminCheck.length > 0,
            admin_email: 'admin@padelo2.com',
            admin_password: 'admin123',
            message: newAdminCheck.length > 0 
              ? 'Database connected. Admin created successfully.' 
              : 'Database connected but admin creation failed.'
          });
        } catch (adminError: any) {
          return NextResponse.json({
            database_configured: true,
            database_connected: true,
            admin_exists: false,
            admin_created: false,
            admin_error: adminError.message,
            message: 'Database connected but admin creation failed. Use /api/admin/create-admin to create admin.'
          });
        }
      }

      return NextResponse.json({
        database_configured: true,
        database_connected: true,
        admin_exists: true,
        admin_email: adminCheck[0].email,
        admin_role: adminCheck[0].role,
        message: 'Database connected. Admin exists.'
      });
    } catch (dbError: any) {
      return NextResponse.json({
        database_configured: true,
        database_connected: false,
        error: dbError.message,
        error_code: dbError.code,
        message: 'Database credentials are set but connection failed. Check your database settings.'
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      database_configured: false,
      database_connected: false,
      error: error.message,
      message: 'Failed to check database connection.'
    }, { status: 500 });
  }
}

