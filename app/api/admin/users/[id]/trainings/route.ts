import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pool = getDbPool();
    
    // Получаем пользователя
    const [userRows] = await pool.execute(
      'SELECT id, email FROM users WHERE id = ? OR email = ?',
      [userId, userId]
    ) as any[];

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Trainings пока не реализованы в БД, возвращаем пустой массив
    // В будущем можно добавить таблицу trainings
    return NextResponse.json({
      trainings: [],
      message: 'Trainings feature not yet implemented',
    });
  } catch (error: any) {
    console.error('Error fetching user trainings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trainings' },
      { status: 500 }
    );
  }
}

