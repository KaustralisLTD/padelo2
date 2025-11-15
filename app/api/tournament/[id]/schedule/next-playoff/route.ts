import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { generateNextPlayoffStageSchedule } from '@/lib/generate-next-playoff-stage';
import { getDbPool } from '@/lib/db';

/**
 * POST - автоматически сгенерировать расписание для следующего этапа Play Off
 * Использует текущее время и свободные корты
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const tournamentId = parseInt(id, 10);
    const body = await request.json();
    const { category } = body;

    if (!category) {
      return NextResponse.json(
        { error: 'category is required' },
        { status: 400 }
      );
    }

    // Получаем настройки турнира (количество кортов)
    const pool = getDbPool();
    const [tournaments] = await pool.execute(
      'SELECT available_courts FROM tournaments WHERE id = ?',
      [tournamentId]
    ) as any[];

    if (tournaments.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const availableCourts = tournaments[0].available_courts || 3;

    // Генерируем расписание для следующего этапа
    const result = await generateNextPlayoffStageSchedule(
      tournamentId,
      category,
      availableCourts,
      45, // matchDurationMinutes
      15  // breakMinutes
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate schedule' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      matchesGenerated: result.matchesGenerated,
      nextStage: result.nextStage,
    });
  } catch (error: any) {
    console.error('Error generating next playoff stage schedule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate schedule' },
      { status: 500 }
    );
  }
}

