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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getDbPool();
    
    const [transactions] = await pool.execute(
      `SELECT id, type, amount, currency, description, status, created_at
       FROM wallet_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [session.userId]
    ) as any[];

    return NextResponse.json({
      transactions: transactions.map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        currency: t.currency || 'EUR',
        description: t.description || '',
        status: t.status || 'completed',
        createdAt: t.created_at ? t.created_at.toISOString() : new Date().toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching wallet transactions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

