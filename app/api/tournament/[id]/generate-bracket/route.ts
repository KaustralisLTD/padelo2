import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import { autoCreateGroupsForCategory, distributePlayersToGroups } from '@/lib/tournaments';

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
    const tournamentId = parseInt(id);

    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const pool = getDbPool();

    // Проверяем статус турнира
    const [tournaments] = await pool.execute(
      'SELECT id, status FROM tournaments WHERE id = ?',
      [tournamentId]
    ) as any[];

    if (tournaments.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournaments[0].status !== 'demo') {
      return NextResponse.json(
        { error: 'This endpoint is only available for demo tournaments' },
        { status: 400 }
      );
    }

    // Получаем все регистрации для турнира
    const [registrations] = await pool.execute(
      `SELECT id, categories FROM tournament_registrations 
       WHERE tournament_id = ? AND confirmed = TRUE`,
      [tournamentId]
    ) as any[];

    if (registrations.length === 0) {
      return NextResponse.json(
        { error: 'No confirmed registrations found for this tournament' },
        { status: 400 }
      );
    }

    // Определяем категории из регистраций
    const categoriesSet = new Set<string>();
    registrations.forEach((reg: any) => {
      try {
        const cats = typeof reg.categories === 'string' ? JSON.parse(reg.categories) : reg.categories;
        if (Array.isArray(cats)) {
          cats.forEach((cat: string) => categoriesSet.add(cat));
        }
      } catch (e) {
        console.error('Error parsing categories:', e);
      }
    });

    if (categoriesSet.size === 0) {
      // Если категории не указаны, используем male1 по умолчанию
      categoriesSet.add('male1');
    }

    const categories = Array.from(categoriesSet);
    console.log(`[generate-bracket] Found categories: ${categories.join(', ')}`);

    // Для каждой категории создаем группы и распределяем участников
    const results: Record<string, { groupsCreated: number; participantsDistributed: number }> = {};

    for (const category of categories) {
      // Проверяем, есть ли уже группы для этой категории
      const [existingGroups] = await pool.execute(
        'SELECT id FROM tournament_groups WHERE tournament_id = ? AND category = ?',
        [tournamentId, category]
      ) as any[];

      if (existingGroups.length > 0) {
        console.log(`[generate-bracket] Category ${category}: Groups already exist (${existingGroups.length} groups), skipping creation`);
        // Проверяем, распределены ли участники
        const [existingPairs] = await pool.execute(
          `SELECT COUNT(*) as count FROM tournament_group_pairs tgp
           JOIN tournament_groups tg ON tgp.group_id = tg.id
           WHERE tg.tournament_id = ? AND tg.category = ? AND tgp.player1_registration_id IS NOT NULL`,
          [tournamentId, category]
        ) as any[];

        if (existingPairs[0].count > 0) {
          console.log(`[generate-bracket] Category ${category}: Participants already distributed (${existingPairs[0].count} pairs)`);
          results[category] = {
            groupsCreated: 0,
            participantsDistributed: existingPairs[0].count,
          };
          continue;
        }
      }

      // Подсчитываем количество пар для этой категории
      const categoryRegistrations = registrations.filter((reg: any) => {
        try {
          const cats = typeof reg.categories === 'string' ? JSON.parse(reg.categories) : reg.categories;
          return Array.isArray(cats) && cats.includes(category);
        } catch {
          return false;
        }
      });

      // Каждая регистрация - это пара (2 участника)
      const pairsCount = categoryRegistrations.length;
      
      if (pairsCount === 0) {
        continue;
      }

      // Определяем количество групп (по 4 пары в группе)
      const pairsPerGroup = 4;
      const numberOfGroups = Math.ceil(pairsCount / pairsPerGroup);

      console.log(`[generate-bracket] Category ${category}: ${pairsCount} pairs, creating ${numberOfGroups} groups`);

      // Создаем группы только если их нет
      let groups;
      if (existingGroups.length === 0) {
        groups = await autoCreateGroupsForCategory(
          tournamentId,
          category,
          numberOfGroups,
          pairsPerGroup
        );
      } else {
        // Получаем существующие группы
        const { getTournamentGroups } = await import('@/lib/tournaments');
        groups = await getTournamentGroups(tournamentId, category);
      }

      // Распределяем участников по группам
      const distribution = await distributePlayersToGroups(tournamentId, category);

      results[category] = {
        groupsCreated: existingGroups.length === 0 ? groups.length : 0,
        participantsDistributed: distribution.distributed,
      };
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error('[generate-bracket] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate bracket' },
      { status: 500 }
    );
  }
}

