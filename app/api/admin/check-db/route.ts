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
    const envVars = {
      DATABASE_HOST: process.env.DATABASE_HOST,
      DATABASE_USER: process.env.DATABASE_USER,
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ? '***' : undefined,
      DATABASE_NAME: process.env.DATABASE_NAME,
      DATABASE_PORT: process.env.DATABASE_PORT || '3306',
    };

    const hasDbConfig = !!(
      envVars.DATABASE_HOST &&
      envVars.DATABASE_USER &&
      process.env.DATABASE_PASSWORD &&
      envVars.DATABASE_NAME
    );

    if (!hasDbConfig) {
      return NextResponse.json({
        success: false,
        database_configured: false,
        database_connected: false,
        message: 'Database environment variables not set',
        missing_vars: Object.entries(envVars)
          .filter(([key, value]) => key !== 'DATABASE_PASSWORD' && !value)
          .map(([key]) => key)
          .concat(process.env.DATABASE_PASSWORD ? [] : ['DATABASE_PASSWORD']),
        hint: 'Add these variables in Vercel Dashboard → Settings → Environment Variables',
        current_env: {
          ...envVars,
          DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ? '***' : undefined,
        }
      }, { status: 200 }); // 200, чтобы показать диагностику, а не ошибку
    }

    // Пытаемся подключиться к БД
    try {
      const pool = getDbPool();
      
      // Простой тестовый запрос
      await pool.execute('SELECT 1 as test');
      
      // Проверяем, существует ли админ
      const [adminCheck] = await pool.execute(
        'SELECT id, email, role, created_at FROM users WHERE email = ?',
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
            success: true,
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
          console.error('Error creating admin:', adminError);
          return NextResponse.json({
            success: true,
            database_configured: true,
            database_connected: true,
            admin_exists: false,
            admin_created: false,
            admin_error: adminError.message,
            admin_error_code: adminError.code,
            message: 'Database connected but admin creation failed. Use /api/admin/create-admin to create admin.'
          });
        }
      }

      return NextResponse.json({
        success: true,
        database_configured: true,
        database_connected: true,
        admin_exists: true,
        admin_email: adminCheck[0].email,
        admin_role: adminCheck[0].role,
        admin_created_at: adminCheck[0].created_at,
        message: 'Database connected. Admin exists.'
      });
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      
      // Детальная диагностика ошибок подключения
      let errorDetails: any = {
        success: false,
        database_configured: true,
        database_connected: false,
        error: dbError.message,
        error_code: dbError.code,
        error_sql_state: dbError.sqlState,
      };

      if (dbError.code === 'ECONNREFUSED') {
        errorDetails.message = 'Cannot connect to database server. Check DATABASE_HOST and DATABASE_PORT.';
        errorDetails.hint = `Verify that ${envVars.DATABASE_HOST}:${envVars.DATABASE_PORT} is accessible.`;
      } else if (dbError.code === 'ER_ACCESS_DENIED_ERROR') {
        errorDetails.message = 'Database access denied. Check DATABASE_USER and DATABASE_PASSWORD.';
        errorDetails.hint = 'Verify database credentials in Vercel environment variables.';
      } else if (dbError.code === 'ER_BAD_DB_ERROR') {
        errorDetails.message = 'Database does not exist. Check DATABASE_NAME.';
        errorDetails.hint = `Verify that database "${envVars.DATABASE_NAME}" exists.`;
      } else if (dbError.code === 'ETIMEDOUT' || dbError.code === 'ENOTFOUND') {
        errorDetails.message = 'Database host not found or connection timed out.';
        errorDetails.hint = `Check DATABASE_HOST: ${envVars.DATABASE_HOST}`;
      } else {
        errorDetails.message = 'Database connection failed. Check your database settings.';
        errorDetails.hint = 'Review Vercel Dashboard → Settings → Environment Variables';
      }

      return NextResponse.json(errorDetails, { status: 200 }); // 200 для диагностики
    }
  } catch (error: any) {
    console.error('Unexpected error in check-db:', error);
    return NextResponse.json({
      success: false,
      database_configured: false,
      database_connected: false,
      error: error.message,
      error_stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      message: 'Failed to check database connection.'
    }, { status: 200 }); // 200 для диагностики, не 500
  }
}

