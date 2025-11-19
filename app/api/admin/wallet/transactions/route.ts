import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
    
    // Обновляем все транзакции с UAH на EUR
    await pool.execute(
      'UPDATE wallet_transactions SET currency = ? WHERE currency = ?',
      ['EUR', 'UAH']
    );
    
    // Получаем все транзакции с информацией о пользователях
    const [transactions] = await pool.execute(`
      SELECT 
        t.id,
        t.wallet_id as walletId,
        t.user_id as userId,
        u.email as userEmail,
        CONCAT(u.first_name, ' ', u.last_name) as userName,
        t.type,
        t.amount,
        t.currency,
        t.description,
        t.reference_type as referenceType,
        t.reference_id as referenceId,
        t.status,
        t.created_by as createdBy,
        t.created_at as createdAt
      FROM wallet_transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 1000
    `) as any[];

    return NextResponse.json({
      transactions: transactions.map((t: any) => ({
        id: t.id,
        walletId: t.walletId,
        userId: t.userId,
        userEmail: t.userEmail,
        userName: t.userName,
        type: t.type,
        amount: parseFloat(t.amount),
        currency: t.currency || 'EUR', // Всегда возвращаем EUR, если валюта не указана
        description: t.description,
        referenceType: t.referenceType,
        referenceId: t.referenceId,
        status: t.status,
        createdBy: t.createdBy,
        createdAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

