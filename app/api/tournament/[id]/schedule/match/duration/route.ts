import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

// PUT - обновить длительность матча (количество слотов)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || (session.role !== 'superadmin' && session.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const tournamentId = parseInt(id, 10);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const body = await request.json();
    const { matchId, durationSlots, matchDate } = body;

    if (!matchId || !durationSlots || durationSlots < 1 || durationSlots > 8) {
      return NextResponse.json({ error: 'Invalid duration slots (must be 1-8)' }, { status: 400 });
    }

    const pool = getDbPool();

    // Проверяем, что матч принадлежит этому турниру
    const [matchCheck] = await pool.execute(
      `SELECT m.id FROM tournament_matches m
       JOIN tournament_groups g ON m.group_id = g.id
       WHERE m.id = ? AND g.tournament_id = ?`,
      [matchId, tournamentId]
    ) as any[];

    if (matchCheck.length === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Обновляем duration_slots (если поле существует)
    // Проверяем, есть ли поле duration_slots
    const [columns] = await pool.execute(
      `SHOW COLUMNS FROM tournament_matches LIKE 'duration_slots'`
    ) as any[];

    if (columns.length > 0) {
      // Поле существует, обновляем
      if (matchDate) {
        // Обновляем и длительность, и время начала
        await pool.execute(
          `UPDATE tournament_matches 
           SET duration_slots = ?, match_date = ?, updated_at = NOW()
           WHERE id = ?`,
          [durationSlots, new Date(matchDate), matchId]
        );
      } else {
        // Обновляем только длительность
      await pool.execute(
        `UPDATE tournament_matches 
         SET duration_slots = ?, updated_at = NOW()
         WHERE id = ?`,
        [durationSlots, matchId]
      );
      }
    } else {
      // Поле не существует - создаем его
      try {
        await pool.execute(
          `ALTER TABLE tournament_matches 
           ADD COLUMN duration_slots INT DEFAULT 3 COMMENT 'Количество временных слотов (1-4, по умолчанию 3)'`
        );
        // Теперь обновляем значение
        if (matchDate) {
          // Обновляем и длительность, и время начала
          await pool.execute(
            `UPDATE tournament_matches 
             SET duration_slots = ?, match_date = ?, updated_at = NOW()
             WHERE id = ?`,
            [durationSlots, new Date(matchDate), matchId]
          );
        } else {
          // Обновляем только длительность
        await pool.execute(
          `UPDATE tournament_matches 
           SET duration_slots = ?, updated_at = NOW()
           WHERE id = ?`,
          [durationSlots, matchId]
        );
        }
      } catch (error: any) {
        // Если поле уже существует или другая ошибка
        console.error('Error adding duration_slots column:', error);
        // Пытаемся обновить напрямую
        await pool.execute(
          `UPDATE tournament_matches 
           SET updated_at = NOW()
           WHERE id = ?`,
          [matchId]
        );
      }
    }

    return NextResponse.json({ success: true, durationSlots });
  } catch (error: any) {
    console.error('Error updating match duration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update match duration' },
      { status: 500 }
    );
  }
}

