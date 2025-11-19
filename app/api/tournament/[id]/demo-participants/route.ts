import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import { autoCreateGroupsForCategory } from '@/lib/tournaments';

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

    const body = await request.json();
    const { count, categoryDistribution } = body;

    // Поддержка старого формата (только count) и нового (categoryDistribution)
    let distribution: Record<string, number> = {};
    
    if (categoryDistribution && typeof categoryDistribution === 'object') {
      // Новый формат: распределение по категориям
      distribution = categoryDistribution;
      const totalCount = Object.values(distribution).reduce((sum, val) => sum + (val || 0), 0);
      if (totalCount < 2 || totalCount % 2 !== 0) {
        return NextResponse.json(
          { error: 'Total count must be an even number >= 2' },
          { status: 400 }
        );
      }
      // Проверяем, что каждая категория имеет четное количество участников
      for (const [category, catCount] of Object.entries(distribution)) {
        if (catCount && catCount % 2 !== 0) {
          return NextResponse.json(
            { error: `Category ${category} must have an even number of participants` },
            { status: 400 }
          );
        }
      }
    } else if (count && typeof count === 'number') {
      // Старый формат: все участники в male1
      if (count < 2 || count % 2 !== 0) {
        return NextResponse.json(
          { error: 'Count must be an even number >= 2' },
          { status: 400 }
        );
      }
      distribution = { male1: count };
    } else {
      return NextResponse.json(
        { error: 'Either count or categoryDistribution must be provided' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Проверяем, что турнир существует и имеет статус demo
    const [tournaments] = await pool.execute(
      'SELECT id, name, status FROM tournaments WHERE id = ?',
      [tournamentId]
    ) as any[];

    if (tournaments.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const tournament = tournaments[0];
    if (tournament.status !== 'demo') {
      return NextResponse.json(
        { error: 'Tournament must have demo status' },
        { status: 400 }
      );
    }

    // Создаем демо-регистрации по категориям
    const registrationsByCategory: Record<string, number[]> = {};
    let globalPlayerIndex = 1;

    // Обрабатываем каждую категорию
    for (const [category, catCount] of Object.entries(distribution)) {
      if (!catCount || catCount === 0) continue;

      const registrations: number[] = [];
      const pairsCount = catCount / 2;

      // Создаем участников для этой категории
      for (let i = 1; i <= catCount; i++) {
        const [result] = await pool.execute(
          `INSERT INTO tournament_registrations 
           (tournament_id, tournament_name, token, locale, first_name, last_name, email, phone, categories, tshirt_size, confirmed, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
          [
            tournamentId,
            tournament.name,
            `demo-${tournamentId}-${globalPlayerIndex}`, // Уникальный токен
            'en', // Локаль по умолчанию
            `Demo`,
            `Player ${globalPlayerIndex}`,
            `demo.player${globalPlayerIndex}@example.com`,
            `+38000000000${globalPlayerIndex}`, // Телефон по умолчанию
            JSON.stringify([category]), // Категория из распределения
            'M', // Размер футболки по умолчанию
          ]
        ) as any[];

        registrations.push(result.insertId);
        globalPlayerIndex++;
      }

      registrationsByCategory[category] = registrations;
      console.log(`[demo-participants] Created ${registrations.length} registrations for category ${category}`);

      // Группируем регистрации по парам для этой категории
      for (let pairIndex = 0; pairIndex < pairsCount; pairIndex++) {
        const player1Id = registrations[pairIndex * 2];
        const player2Id = registrations[pairIndex * 2 + 1];
        const player1GlobalIndex = globalPlayerIndex - catCount + pairIndex * 2;
        const player2GlobalIndex = globalPlayerIndex - catCount + pairIndex * 2 + 1;

        // Обновляем первую регистрацию в паре - добавляем информацию о партнере
        await pool.execute(
          `UPDATE tournament_registrations 
           SET partner_name = ?, partner_email = ?
           WHERE id = ?`,
          [`Demo Player ${player2GlobalIndex}`, `demo.player${player2GlobalIndex}@example.com`, player1Id]
        );

        // Обновляем вторую регистрацию в паре - добавляем информацию о партнере
        await pool.execute(
          `UPDATE tournament_registrations 
           SET partner_name = ?, partner_email = ?
           WHERE id = ?`,
          [`Demo Player ${player1GlobalIndex}`, `demo.player${player1GlobalIndex}@example.com`, player2Id]
        );
      }
    }

    const totalRegistrations = Object.values(registrationsByCategory).reduce((sum, regs) => sum + regs.length, 0);
    console.log(`[demo-participants] Created ${totalRegistrations} total demo registrations`);

    // Создаем группы и распределяем пары для каждой категории
    const pairsPerGroup = 4;
    const { createMissingMatchesForGroup } = await import('@/lib/matches');
    let totalMatchesCreated = 0;
    const categoryStats: Record<string, { pairs: number; groups: number; matches: number }> = {};

    for (const [category, registrations] of Object.entries(registrationsByCategory)) {
      const pairsCount = registrations.length / 2;
      const numberOfGroups = Math.ceil(pairsCount / pairsPerGroup);

      console.log(`[demo-participants] Creating ${numberOfGroups} groups for category ${category} with ${pairsPerGroup} pairs per group`);

      // Создаем группы для категории
      const groups = await autoCreateGroupsForCategory(
        tournamentId,
        category,
        numberOfGroups,
        pairsPerGroup
      );

      console.log(`[demo-participants] Created ${groups.length} groups for category ${category}`);

      // Распределяем пары по группам
      for (let pairIndex = 0; pairIndex < pairsCount; pairIndex++) {
        const groupIndex = Math.floor(pairIndex / pairsPerGroup);
        const group = groups[groupIndex];
        const pairNumberInGroup = (pairIndex % pairsPerGroup) + 1;

        const player1Id = registrations[pairIndex * 2];
        const player2Id = registrations[pairIndex * 2 + 1];

        // Создаем пару в группе
        await pool.execute(
          `INSERT INTO tournament_group_pairs 
           (group_id, pair_number, player1_registration_id, partner1_registration_id, updated_at)
           VALUES (?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE 
           player1_registration_id = VALUES(player1_registration_id),
           partner1_registration_id = VALUES(partner1_registration_id),
           updated_at = NOW()`,
          [group.id, pairNumberInGroup, player1Id, player2Id]
        );
      }

      console.log(`[demo-participants] Created ${pairsCount} pairs in groups for category ${category}`);

      // Создаем матчи для всех групп этой категории
      let categoryMatches = 0;
      for (const group of groups) {
        try {
          const result = await createMissingMatchesForGroup(group.id);
          categoryMatches += result.created;
          console.log(`[demo-participants] Created ${result.created} matches for group ${group.groupName}`);
        } catch (error) {
          console.error(`[demo-participants] Error creating matches for group ${group.id}:`, error);
        }
      }

      totalMatchesCreated += categoryMatches;
      categoryStats[category] = {
        pairs: pairsCount,
        groups: groups.length,
        matches: categoryMatches,
      };
    }

    return NextResponse.json({
      success: true,
      registrationsCreated: totalRegistrations,
      totalPairsCreated: Object.values(categoryStats).reduce((sum, stat) => sum + stat.pairs, 0),
      totalGroupsCreated: Object.values(categoryStats).reduce((sum, stat) => sum + stat.groups, 0),
      totalMatchesCreated,
      categoryStats,
    });
  } catch (error: any) {
    console.error('[demo-participants] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create demo participants' },
      { status: 500 }
    );
  }
}

