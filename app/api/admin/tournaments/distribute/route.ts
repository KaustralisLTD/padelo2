import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { distributePlayersToGroups } from '@/lib/tournaments';

/**
 * POST - распределить игроков по группам для категории
 * 
 * ВАЖНО: Если участник зарегистрирован в нескольких категориях (например, male1 и mixed1),
 * он будет распределен в группы для каждой категории отдельно при вызове этого endpoint
 * для каждой категории. Одна регистрация может быть в нескольких группах одновременно
 * (по одной группе на каждую категорию).
 * 
 * Пример: Участник зарегистрирован в male1 и mixed1
 * - При вызове для male1: он будет распределен в группы категории male1
 * - При вызове для mixed1: он будет распределен в группы категории mixed1
 * - Итого: один участник = два игрока (по одному в каждой категории)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (session?.role !== 'superadmin' && session?.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { tournamentId, category } = body;

    if (!tournamentId || !category) {
      return NextResponse.json(
        { error: 'tournamentId and category are required' },
        { status: 400 }
      );
    }

    const result = await distributePlayersToGroups(tournamentId, category);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error distributing players:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to distribute players' },
      { status: 500 }
    );
  }
}

