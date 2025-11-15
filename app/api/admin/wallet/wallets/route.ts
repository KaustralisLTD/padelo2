import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
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
    
    // Получаем все кошельки с информацией о пользователях
    const [wallets] = await pool.execute(`
      SELECT 
        w.id,
        w.user_id as userId,
        u.email as userEmail,
        CONCAT(u.first_name, ' ', u.last_name) as userName,
        w.balance,
        w.currency,
        w.updated_at as updatedAt
      FROM user_wallets w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.updated_at DESC
    `) as any[];

    return NextResponse.json({
      wallets: wallets.map((w: any) => ({
        id: w.id,
        userId: w.userId,
        userEmail: w.userEmail,
        userName: w.userName,
        balance: parseFloat(w.balance),
        currency: w.currency,
        updatedAt: w.updatedAt ? w.updatedAt.toISOString() : new Date().toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching wallets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
}

