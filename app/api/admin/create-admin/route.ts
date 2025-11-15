import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

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
 * GET - проверить, существует ли админ
 */
export async function GET() {
  try {
    const pool = getDbPool();
    const [existing] = await pool.execute(
      'SELECT id, email, role, created_at FROM users WHERE email = ?',
      ['admin@padelo2.com']
    ) as any[];
    
    if (existing.length > 0) {
      return NextResponse.json({
        exists: true,
        email: existing[0].email,
        role: existing[0].role,
        created_at: existing[0].created_at,
      });
    } else {
      return NextResponse.json({
        exists: false,
        message: 'Admin does not exist. Call POST to create.',
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Failed to check admin',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

