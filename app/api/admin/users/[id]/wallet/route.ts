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

    const user = userRows[0];

    // Получаем или создаем кошелек
    let [wallets] = await pool.execute(
      'SELECT * FROM user_wallets WHERE user_id = ?',
      [user.id]
    ) as any[];

    if (wallets.length === 0) {
      // Создаем кошелек если его нет
      await pool.execute(
        'INSERT INTO user_wallets (user_id, balance, currency) VALUES (?, 0.00, ?)',
        [user.id, 'EUR']
      );
      [wallets] = await pool.execute(
        'SELECT * FROM user_wallets WHERE user_id = ?',
        [user.id]
      ) as any[];
    }

    const wallet = wallets[0];

    // Получаем транзакции
    const [transactions] = await pool.execute(`
      SELECT 
        wt.id,
        wt.type,
        wt.amount,
        wt.currency,
        wt.description,
        wt.reference_type,
        wt.reference_id,
        wt.status,
        wt.created_at
      FROM wallet_transactions wt
      WHERE wt.user_id = ?
      ORDER BY wt.created_at DESC
      LIMIT 100
    `, [user.id]) as any[];

    return NextResponse.json({
      wallet: {
        id: wallet.id,
        userId: wallet.user_id,
        balance: parseFloat(wallet.balance),
        currency: wallet.currency,
        updatedAt: wallet.updated_at ? wallet.updated_at.toISOString() : wallet.created_at.toISOString(),
      },
      transactions: transactions.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        currency: t.currency,
        description: t.description,
        referenceType: t.reference_type,
        referenceId: t.reference_id,
        status: t.status,
        createdAt: t.created_at ? t.created_at.toISOString() : new Date().toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching user wallet:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}

