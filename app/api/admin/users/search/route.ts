import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/users';
import { getSession } from '@/lib/users';
import { UserRole } from '@/lib/auth';
import { getDbPool } from '@/lib/db';

async function checkAdminAccess(request: NextRequest): Promise<{ authorized: boolean }> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

  if (!token) {
    return { authorized: false };
  }

  const session = await getSession(token);
  if (!session || session.role !== 'superadmin') {
    return { authorized: false };
  }

  return { authorized: true };
}

export async function GET(request: NextRequest) {
  const access = await checkAdminAccess(request);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const pool = getDbPool();
    
    // Получаем пользователей с preferred_language напрямую из БД
    let sql = `SELECT id, email, first_name, last_name, preferred_language, email_verified 
               FROM users 
               WHERE email_verified = 1`;
    const params: any[] = [];
    
    if (query.trim()) {
      sql += ` AND (
        LOWER(first_name) LIKE ? OR 
        LOWER(last_name) LIKE ? OR 
        LOWER(email) LIKE ? OR
        LOWER(CONCAT(first_name, ' ', last_name)) LIKE ?
      )`;
      const searchPattern = `%${query.toLowerCase()}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);
    
    const [rows] = await pool.execute(sql, params) as any[];

    return NextResponse.json({ 
      users: rows.map((user: any) => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        preferredLanguage: user.preferred_language || 'en',
      }))
    });
  } catch (error: any) {
    console.error('Error searching users:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

