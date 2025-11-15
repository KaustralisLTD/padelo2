import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const SALT_ROUNDS = 10;

/**
 * POST - создать или обновить админа (только для первого запуска)
 * Этот endpoint можно вызвать один раз для создания админа
 * После создания админа рекомендуется удалить или защитить этот endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Проверяем, есть ли секретный ключ для защиты endpoint
    const authHeader = request.headers.get('authorization');
    const secretKey = process.env.ADMIN_CREATE_SECRET || 'temporary-secret-key-change-in-production';
    
    if (authHeader !== `Bearer ${secretKey}`) {
      // Разрешаем без ключа только если админа еще нет (первый запуск)
      const pool = getDbPool();
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ? OR role = ?',
        ['admin@padelo2.com', 'superadmin']
      ) as any[];
      
      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'Admin already exists. Use authorization header with ADMIN_CREATE_SECRET.' },
          { status: 403 }
        );
      }
    }

    const pool = getDbPool();
    
    // Проверяем, существует ли админ
    const [existing] = await pool.execute(
      'SELECT id, email, role FROM users WHERE email = ?',
      ['admin@padelo2.com']
    ) as any[];
    
    const adminId = existing.length > 0 
      ? existing[0].id 
      : crypto.randomBytes(16).toString('hex');
    
    const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
    
    if (existing.length > 0) {
      // Обновляем существующего админа
      await pool.execute(
        `UPDATE users 
         SET password_hash = ?, role = 'superadmin', updated_at = NOW()
         WHERE email = 'admin@padelo2.com'`,
        [passwordHash]
      );
      
      return NextResponse.json({
        success: true,
        message: 'Admin password reset successfully',
        email: 'admin@padelo2.com',
        password: 'admin123',
        role: 'superadmin',
      });
    } else {
      // Создаем нового админа
      await pool.execute(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [adminId, 'admin@padelo2.com', passwordHash, 'Super', 'Admin', 'superadmin']
      );
      
      return NextResponse.json({
        success: true,
        message: 'Admin created successfully',
        email: 'admin@padelo2.com',
        password: 'admin123',
        role: 'superadmin',
      });
    }
  } catch (error: any) {
    console.error('Error creating admin:', error);
    
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Database')) {
      return NextResponse.json(
        { 
          error: 'Database not configured or connection failed',
          details: 'Please configure DATABASE_* environment variables in Vercel',
          hint: 'Check Vercel Dashboard → Settings → Environment Variables'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create admin',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET - проверить, существует ли админ, или создать если нет
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
        success: false,
        error: 'Database not configured',
        message: 'Database environment variables not set in Vercel',
        required_vars: [
          'DATABASE_HOST',
          'DATABASE_USER',
          'DATABASE_PASSWORD',
          'DATABASE_NAME'
        ],
        hint: 'Add these variables in Vercel Dashboard → Settings → Environment Variables'
      }, { status: 500 });
    }

    const pool = getDbPool();
    const [existing] = await pool.execute(
      'SELECT id, email, role, created_at FROM users WHERE email = ?',
      ['admin@padelo2.com']
    ) as any[];
    
    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        exists: true,
        email: existing[0].email,
        role: existing[0].role,
        created_at: existing[0].created_at,
        message: 'Admin already exists. Use POST to reset password.',
      });
    } else {
      // Автоматически создаем админа при GET запросе, если его нет
      const adminId = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
      
      await pool.execute(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [adminId, 'admin@padelo2.com', passwordHash, 'Super', 'Admin', 'superadmin']
      );
      
      return NextResponse.json({
        success: true,
        exists: false,
        created: true,
        message: 'Admin created successfully via GET request',
        email: 'admin@padelo2.com',
        password: 'admin123',
        role: 'superadmin',
      });
    }
  } catch (error: any) {
    console.error('Error in GET /api/admin/create-admin:', error);
    
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Database')) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        message: 'Cannot connect to database. Check your DATABASE_* environment variables in Vercel.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 });
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      return NextResponse.json({
        success: false,
        error: 'Database access denied',
        message: 'Invalid database credentials. Check DATABASE_USER and DATABASE_PASSWORD in Vercel.',
      }, { status: 500 });
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check/create admin',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

