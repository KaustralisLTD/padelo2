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
    const { count } = body;

    if (!count || typeof count !== 'number' || count < 2 || count % 2 !== 0) {
      return NextResponse.json(
        { error: 'Count must be an even number >= 2' },
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

    if (tournaments[0].status !== 'demo') {
      return NextResponse.json(
        { error: 'Tournament must have demo status' },
        { status: 400 }
      );
    }

    // Создаем демо-регистрации
    const registrations: number[] = [];
    const pairsCount = count / 2; // Количество пар

    for (let i = 1; i <= count; i++) {
      const pairNumber = Math.ceil(i / 2); // Номер пары (1, 1, 2, 2, 3, 3, ...)
      const isFirstInPair = i % 2 === 1; // Первый или второй в паре

      const [result] = await pool.execute(
        `INSERT INTO tournament_registrations 
         (tournament_id, token, first_name, last_name, email, categories, confirmed, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
        [
          tournamentId,
          `demo-${tournamentId}-${i}`, // Уникальный токен
          `Demo`,
          `Player ${i}`,
          `demo.player${i}@example.com`,
          JSON.stringify(['male1']), // По умолчанию категория male1
          true,
        ]
      ) as any[];

      registrations.push(result.insertId);
    }

    console.log(`[demo-participants] Created ${registrations.length} demo registrations`);

    // Группируем регистрации по парам
    // Для каждой пары: player1_registration_id и partner1_registration_id указывают на регистрации в паре
    // Обновляем регистрации с информацией о партнере
    for (let pairIndex = 0; pairIndex < pairsCount; pairIndex++) {
      const player1Id = registrations[pairIndex * 2];
      const player2Id = registrations[pairIndex * 2 + 1];

      // Обновляем первую регистрацию в паре - добавляем информацию о партнере
      await pool.execute(
        `UPDATE tournament_registrations 
         SET partner_name = ?, partner_email = ?, updated_at = NOW()
         WHERE id = ?`,
        [`Demo Player ${pairIndex * 2 + 2}`, `demo.player${pairIndex * 2 + 2}@example.com`, player1Id]
      );

      // Обновляем вторую регистрацию в паре - добавляем информацию о партнере
      await pool.execute(
        `UPDATE tournament_registrations 
         SET partner_name = ?, partner_email = ?, updated_at = NOW()
         WHERE id = ?`,
        [`Demo Player ${pairIndex * 2 + 1}`, `demo.player${pairIndex * 2 + 1}@example.com`, player2Id]
      );
    }

    // Определяем количество групп (по 4 пары в группе)
    const pairsPerGroup = 4;
    const numberOfGroups = Math.ceil(pairsCount / pairsPerGroup);

    console.log(`[demo-participants] Creating ${numberOfGroups} groups with ${pairsPerGroup} pairs per group`);

    // Создаем группы для категории male1
    const category = 'male1';
    const groups = await autoCreateGroupsForCategory(
      tournamentId,
      category,
      numberOfGroups,
      pairsPerGroup
    );

    console.log(`[demo-participants] Created ${groups.length} groups`);

    // Распределяем пары по группам
    // Сначала создаем пары в таблице tournament_group_pairs
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

    console.log(`[demo-participants] Created ${pairsCount} pairs in groups`);

    // Создаем матчи для всех групп
    const { createMissingMatchesForGroup } = await import('@/lib/matches');
    let totalMatchesCreated = 0;

    for (const group of groups) {
      try {
        const result = await createMissingMatchesForGroup(group.id);
        totalMatchesCreated += result.created;
        console.log(`[demo-participants] Created ${result.created} matches for group ${group.groupName}`);
      } catch (error) {
        console.error(`[demo-participants] Error creating matches for group ${group.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      registrationsCreated: registrations.length,
      pairsCreated: pairsCount,
      groupsCreated: groups.length,
      matchesCreated: totalMatchesCreated,
    });
  } catch (error: any) {
    console.error('[demo-participants] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create demo participants' },
      { status: 500 }
    );
  }
}

