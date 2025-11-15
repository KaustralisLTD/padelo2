import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { countParticipantsByCategory, getTotalParticipantSlots, getUniqueParticipantCount } from '@/lib/tournaments';

/**
 * GET - получить статистику участников по категориям для турнира
 * ВАЖНО: Если участник зарегистрирован в нескольких категориях, он считается
 * как отдельный игрок в каждой категории
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'tournamentId is required' },
        { status: 400 }
      );
    }

    const categoryCounts = await countParticipantsByCategory(parseInt(tournamentId, 10));
    const totalSlots = await getTotalParticipantSlots(parseInt(tournamentId, 10));
    const uniqueCount = await getUniqueParticipantCount(parseInt(tournamentId, 10));

    return NextResponse.json({
      byCategory: categoryCounts,
      totalSlots, // Общее количество "слотов" (с учетом множественных категорий)
      uniqueParticipants: uniqueCount, // Количество уникальных участников
      note: 'If a participant is registered in multiple categories, they are counted separately for each category'
    });
  } catch (error: any) {
    console.error('Error getting tournament stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get tournament stats' },
      { status: 500 }
    );
  }
}

