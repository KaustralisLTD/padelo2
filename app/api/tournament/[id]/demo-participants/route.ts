import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import { autoCreateGroupsForCategory } from '@/lib/tournaments';
import crypto from 'crypto';

// Списки реальных имен и фамилий для генерации демо-участников
const firstNames = [
  'Alex', 'David', 'Carlos', 'Miguel', 'Juan', 'Pablo', 'Sergio', 'Antonio', 'Javier', 'Luis',
  'Maria', 'Ana', 'Laura', 'Carmen', 'Sofia', 'Isabel', 'Elena', 'Patricia', 'Monica', 'Andrea',
  'James', 'Michael', 'Robert', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Daniel', 'Matthew',
  'Sarah', 'Jessica', 'Jennifer', 'Emily', 'Michelle', 'Amanda', 'Melissa', 'Nicole', 'Stephanie', 'Rachel',
  'Marco', 'Luca', 'Giuseppe', 'Francesco', 'Alessandro', 'Matteo', 'Andrea', 'Giovanni', 'Stefano', 'Roberto',
  'Emma', 'Giulia', 'Sofia', 'Alessia', 'Chiara', 'Francesca', 'Martina', 'Valentina', 'Giorgia', 'Elisa'
];

const lastNames = [
  'Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
  'Muller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
  'Andersen', 'Johansen', 'Hansen', 'Pedersen', 'Larsen', 'Nielsen', 'Olsen', 'Christensen', 'Rasmussen', 'Jorgensen'
];

function generateRandomName(): { firstName: string; lastName: string } {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return { firstName, lastName };
}

// Helper function to get or create user by email for demo participants
async function getOrCreateUserByEmail(email: string, firstName: string, lastName: string): Promise<string | null> {
  try {
    const pool = getDbPool();
    
    // Ищем существующего пользователя по email
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];
    
    if (existingUsers.length > 0) {
      return existingUsers[0].id;
    }
    
    // Создаем нового пользователя с ролью 'participant'
    const userId = crypto.randomUUID();
    const defaultPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = crypto.createHash('sha256').update(defaultPassword).digest('hex');
    
    await pool.execute(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at)
       VALUES (?, ?, ?, ?, ?, 'participant', NOW())`,
      [userId, email, passwordHash, firstName, lastName]
    );
    
    return userId;
  } catch (error) {
    console.error('Error getting or creating user by email:', error);
    return null;
  }
}

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
        const { firstName, lastName } = generateRandomName();
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${globalPlayerIndex}@demo.example.com`;
        
        // Получаем или создаем user_id по email
        const userId = await getOrCreateUserByEmail(email, firstName, lastName);
        
        const [result] = await pool.execute(
          `INSERT INTO tournament_registrations 
           (tournament_id, user_id, tournament_name, token, locale, first_name, last_name, email, phone, categories, tshirt_size, confirmed, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())`,
          [
            tournamentId,
            userId,
            tournament.name,
            `demo-${tournamentId}-${globalPlayerIndex}`, // Уникальный токен
            'en', // Локаль по умолчанию
            firstName,
            lastName,
            email,
            `+380${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`, // Случайный телефон
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

        // Получаем информацию об участниках из базы данных
        const [player1Data] = await pool.execute(
          'SELECT first_name, last_name, email FROM tournament_registrations WHERE id = ?',
          [player1Id]
        ) as any[];
        
        const [player2Data] = await pool.execute(
          'SELECT first_name, last_name, email FROM tournament_registrations WHERE id = ?',
          [player2Id]
        ) as any[];

        const player1Name = `${player1Data[0].first_name} ${player1Data[0].last_name}`;
        const player2Name = `${player2Data[0].first_name} ${player2Data[0].last_name}`;

        // Обновляем первую регистрацию в паре - добавляем информацию о партнере
        await pool.execute(
          `UPDATE tournament_registrations 
           SET partner_name = ?, partner_email = ?
           WHERE id = ?`,
          [player2Name, player2Data[0].email, player1Id]
        );

        // Обновляем вторую регистрацию в паре - добавляем информацию о партнере
        await pool.execute(
          `UPDATE tournament_registrations 
           SET partner_name = ?, partner_email = ?
           WHERE id = ?`,
          [player1Name, player1Data[0].email, player2Id]
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

// DELETE - удалить всех демо-участников турнира
export async function DELETE(
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

    // Проверяем, что турнир существует
    const [tournaments] = await pool.execute(
      'SELECT id, status FROM tournaments WHERE id = ?',
      [tournamentId]
    ) as any[];

    if (tournaments.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Получаем все демо-регистрации для этого турнира (по токену demo-{tournamentId}-*)
    const [demoRegistrations] = await pool.execute(
      'SELECT id FROM tournament_registrations WHERE tournament_id = ? AND token LIKE ?',
      [tournamentId, `demo-${tournamentId}-%`]
    ) as any[];

    if (demoRegistrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No demo participants found',
        deletedCount: 0,
      });
    }

    const registrationIds = demoRegistrations.map((r: any) => r.id);

    // Удаляем связанные данные в правильном порядке (из-за внешних ключей)
    // 1. Удаляем матчи, связанные с группами, которые содержат эти регистрации
    await pool.execute(
      `DELETE tm FROM tournament_matches tm
       INNER JOIN tournament_group_pairs tgp ON tm.group_id = tgp.group_id
       WHERE tgp.player1_registration_id IN (${registrationIds.map(() => '?').join(',')})
          OR tgp.partner1_registration_id IN (${registrationIds.map(() => '?').join(',')})`,
      [...registrationIds, ...registrationIds]
    );

    // 2. Удаляем пары из групп
    await pool.execute(
      `DELETE FROM tournament_group_pairs 
       WHERE player1_registration_id IN (${registrationIds.map(() => '?').join(',')})
          OR partner1_registration_id IN (${registrationIds.map(() => '?').join(',')})`,
      [...registrationIds, ...registrationIds]
    );

    // 3. Удаляем группы, которые были созданы только для демо-участников
    // (удаляем группы, которые больше не имеют пар)
    await pool.execute(
      `DELETE FROM tournament_groups 
       WHERE tournament_id = ? 
       AND id NOT IN (SELECT DISTINCT group_id FROM tournament_group_pairs)`,
      [tournamentId]
    );

    // 4. Удаляем регистрации
    await pool.execute(
      `DELETE FROM tournament_registrations 
       WHERE id IN (${registrationIds.map(() => '?').join(',')})`,
      registrationIds
    );

    console.log(`[demo-participants] Deleted ${demoRegistrations.length} demo participants for tournament ${tournamentId}`);

    return NextResponse.json({
      success: true,
      deletedCount: demoRegistrations.length,
      message: `Deleted ${demoRegistrations.length} demo participants`,
    });
  } catch (error: any) {
    console.error('[demo-participants] Error deleting demo participants:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete demo participants' },
      { status: 500 }
    );
  }
}
