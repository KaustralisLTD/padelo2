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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();
    
    const [wallets] = await pool.execute(
      'SELECT balance, currency FROM user_wallets WHERE user_id = ?',
      [session.userId]
    ) as any[];

    if (wallets.length === 0) {
      // Создаем кошелек, если его нет
      await pool.execute(
        'INSERT INTO user_wallets (user_id, balance, currency) VALUES (?, 0, ?)',
        [session.userId, 'EUR']
      );
      return NextResponse.json({
        wallet: { balance: 0, currency: 'EUR' },
      });
    }

    return NextResponse.json({
      wallet: {
        balance: wallets[0].balance,
        currency: wallets[0].currency || 'EUR',
      },
    });
  } catch (error: any) {
    console.error('Error fetching user wallet:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}

