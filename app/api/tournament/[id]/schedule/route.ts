import { NextRequest, NextResponse } from 'next/server';
import { getSession, findUserById } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';

// GET - получить расписание для турнира/категории
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let tournamentId: number | null = null;
  let category: string | null = null;
  let groupId: string | null = null;
  
  try {
    const { id } = await params;
    tournamentId = parseInt(id, 10);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    category = searchParams.get('category');
    groupId = searchParams.get('groupId');

    let pool;
    try {
      pool = getDbPool();
    } catch (error: any) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { error: 'Database not configured', matches: [] },
        { status: 500 }
      );
    }

    if (groupId) {
      // Получить расписание для конкретной группы
      const [matches] = await pool.execute(
        `SELECT 
          m.id, m.group_id, m.pair1_id, m.pair2_id, m.match_date, m.court_number,
          m.pair1_games, m.pair2_games, m.winner_pair_id,
          m.pair1_set1, m.pair1_set2, m.pair1_set3,
          m.pair2_set1, m.pair2_set2, m.pair2_set3,
          COALESCE(m.duration_slots, 3) as duration_slots,
          g.category, g.group_name,
          p1.pair_number as pair1_number,
          p2.pair_number as pair2_number,
          p1.player1_registration_id as pair1_player1_id,
          p2.player1_registration_id as pair2_player1_id
         FROM tournament_matches m
         JOIN tournament_groups g ON m.group_id = g.id
         LEFT JOIN tournament_group_pairs p1 ON m.pair1_id = p1.id
         LEFT JOIN tournament_group_pairs p2 ON m.pair2_id = p2.id
         WHERE m.group_id = ?
         ORDER BY m.match_date, m.court_number`,
        [parseInt(groupId, 10)]
      ) as any[];

      // Получаем имена игроков одним запросом (оптимизация для уменьшения соединений)
      const registrationIds = new Set<number>();
      matches.forEach((match: any) => {
        if (match.pair1_player1_id) registrationIds.add(match.pair1_player1_id);
        if (match.pair1_player2_id) registrationIds.add(match.pair1_player2_id);
        if (match.pair2_player1_id) registrationIds.add(match.pair2_player1_id);
        if (match.pair2_player2_id) registrationIds.add(match.pair2_player2_id);
      });

      const registrationsMap = new Map<number, any>();
      if (registrationIds.size > 0) {
        const ids = Array.from(registrationIds);
        const placeholders = ids.map(() => '?').join(',');
        const [regs] = await pool.execute(
          `SELECT id, first_name, last_name, partner_name FROM tournament_registrations WHERE id IN (${placeholders})`,
          ids
        ) as any[];
        regs.forEach((reg: any) => {
          registrationsMap.set(reg.id, reg);
        });
      }

      const matchesWithPlayers = matches.map((match: any) => {
        const players1: string[] = [];
        const players2: string[] = [];

        // Игрок 1 пары 1
        if (match.pair1_player1_id) {
          const reg1 = registrationsMap.get(match.pair1_player1_id);
          if (reg1) {
            players1.push(`${reg1.first_name} ${reg1.last_name}`);
          }
        }
        // Игрок 2 пары 1
        if (match.pair1_player2_id) {
          const reg2 = registrationsMap.get(match.pair1_player2_id);
          if (reg2) {
            players1.push(`${reg2.first_name} ${reg2.last_name}`);
          }
        }

        // Игрок 1 пары 2
        if (match.pair2_player1_id) {
          const reg3 = registrationsMap.get(match.pair2_player1_id);
          if (reg3) {
            players2.push(`${reg3.first_name} ${reg3.last_name}`);
          }
        }
        // Игрок 2 пары 2
        if (match.pair2_player2_id) {
          const reg4 = registrationsMap.get(match.pair2_player2_id);
          if (reg4) {
            players2.push(`${reg4.first_name} ${reg4.last_name}`);
          }
        }

        return { ...match, pair1_players: players1, pair2_players: players2 };
      });

      return NextResponse.json({ matches: matchesWithPlayers });
    } else if (category) {
      // Получить расписание для категории
      const [matches] = await pool.execute(
        `SELECT 
          m.id, m.group_id, m.pair1_id, m.pair2_id, m.match_date, m.court_number,
          m.pair1_games, m.pair2_games, m.winner_pair_id,
          m.pair1_set1, m.pair1_set2, m.pair1_set3,
          m.pair2_set1, m.pair2_set2, m.pair2_set3,
          COALESCE(m.duration_slots, 3) as duration_slots,
          g.group_name, g.group_number, g.category,
          p1.pair_number as pair1_number,
          p2.pair_number as pair2_number,
          p1.player1_registration_id as pair1_player1_id,
          p1.player2_registration_id as pair1_player2_id,
          p1.partner1_registration_id as pair1_partner1_id,
          p1.partner2_registration_id as pair1_partner2_id,
          p2.player1_registration_id as pair2_player1_id,
          p2.player2_registration_id as pair2_player2_id,
          p2.partner1_registration_id as pair2_partner1_id,
          p2.partner2_registration_id as pair2_partner2_id
         FROM tournament_matches m
         JOIN tournament_groups g ON m.group_id = g.id
         LEFT JOIN tournament_group_pairs p1 ON m.pair1_id = p1.id
         LEFT JOIN tournament_group_pairs p2 ON m.pair2_id = p2.id
         WHERE g.tournament_id = ? AND g.category = ?
         ORDER BY m.match_date, m.court_number, g.group_number`,
        [tournamentId, category]
      ) as any[];

      // Получаем имена игроков одним запросом (оптимизация для уменьшения соединений)
      const registrationIds = new Set<number>();
      matches.forEach((match: any) => {
        if (match.pair1_player1_id) registrationIds.add(match.pair1_player1_id);
        if (match.pair1_player2_id) registrationIds.add(match.pair1_player2_id);
        if (match.pair2_player1_id) registrationIds.add(match.pair2_player1_id);
        if (match.pair2_player2_id) registrationIds.add(match.pair2_player2_id);
      });

      const registrationsMap = new Map<number, any>();
      if (registrationIds.size > 0) {
        const ids = Array.from(registrationIds);
        const placeholders = ids.map(() => '?').join(',');
        const [regs] = await pool.execute(
          `SELECT id, first_name, last_name, partner_name FROM tournament_registrations WHERE id IN (${placeholders})`,
          ids
        ) as any[];
        regs.forEach((reg: any) => {
          registrationsMap.set(reg.id, reg);
        });
      }

      const matchesWithPlayers = matches.map((match: any) => {
        const players1: string[] = [];
        const players2: string[] = [];

        // Игрок 1 пары 1
        if (match.pair1_player1_id) {
          const reg1 = registrationsMap.get(match.pair1_player1_id);
          if (reg1) {
            players1.push(`${reg1.first_name} ${reg1.last_name}`);
          }
        }
        // Игрок 2 пары 1
        if (match.pair1_player2_id) {
          const reg2 = registrationsMap.get(match.pair1_player2_id);
          if (reg2) {
            players1.push(`${reg2.first_name} ${reg2.last_name}`);
          }
        }

        // Игрок 1 пары 2
        if (match.pair2_player1_id) {
          const reg3 = registrationsMap.get(match.pair2_player1_id);
          if (reg3) {
            players2.push(`${reg3.first_name} ${reg3.last_name}`);
          }
        }
        // Игрок 2 пары 2
        if (match.pair2_player2_id) {
          const reg4 = registrationsMap.get(match.pair2_player2_id);
          if (reg4) {
            players2.push(`${reg4.first_name} ${reg4.last_name}`);
          }
        }

        // Форматируем пары: "Имя1 Фамилия1 & Имя2 Фамилия2"
        const pair1Formatted = players1.length === 2 
          ? `${players1[0]} & ${players1[1]}`
          : players1.join(' / ');
        const pair2Formatted = players2.length === 2 
          ? `${players2[0]} & ${players2[1]}`
          : players2.join(' / ');
        
        return { 
          ...match, 
          pair1_players: players1, 
          pair2_players: players2,
          pair1_formatted: pair1Formatted,
          pair2_formatted: pair2Formatted
        };
      });

      return NextResponse.json({ matches: matchesWithPlayers });
    } else {
      // Получить все расписание турнира
      const [matches] = await pool.execute(
        `SELECT 
          m.id, m.group_id, m.pair1_id, m.pair2_id, m.match_date, m.court_number,
          m.pair1_games, m.pair2_games, m.winner_pair_id,
          m.pair1_set1, m.pair1_set2, m.pair1_set3,
          m.pair2_set1, m.pair2_set2, m.pair2_set3,
          COALESCE(m.duration_slots, 3) as duration_slots,
          g.group_name, g.group_number, g.category,
          p1.pair_number as pair1_number,
          p2.pair_number as pair2_number,
          p1.player1_registration_id as pair1_player1_id,
          p1.player2_registration_id as pair1_player2_id,
          p1.partner1_registration_id as pair1_partner1_id,
          p1.partner2_registration_id as pair1_partner2_id,
          p2.player1_registration_id as pair2_player1_id,
          p2.player2_registration_id as pair2_player2_id,
          p2.partner1_registration_id as pair2_partner1_id,
          p2.partner2_registration_id as pair2_partner2_id
         FROM tournament_matches m
         JOIN tournament_groups g ON m.group_id = g.id
         LEFT JOIN tournament_group_pairs p1 ON m.pair1_id = p1.id
         LEFT JOIN tournament_group_pairs p2 ON m.pair2_id = p2.id
         WHERE g.tournament_id = ?
         ORDER BY 
           CASE WHEN m.match_date IS NULL THEN 1 ELSE 0 END,
           m.match_date, 
           m.court_number, 
           g.category, 
           g.group_number`,
        [tournamentId]
      ) as any[];

      // Получаем имена игроков одним запросом (оптимизация для уменьшения соединений)
      const registrationIds = new Set<number>();
      matches.forEach((match: any) => {
        if (match.pair1_player1_id) registrationIds.add(match.pair1_player1_id);
        if (match.pair1_player2_id) registrationIds.add(match.pair1_player2_id);
        if (match.pair2_player1_id) registrationIds.add(match.pair2_player1_id);
        if (match.pair2_player2_id) registrationIds.add(match.pair2_player2_id);
      });

      const registrationsMap = new Map<number, any>();
      if (registrationIds.size > 0) {
        const ids = Array.from(registrationIds);
        const placeholders = ids.map(() => '?').join(',');
        const [regs] = await pool.execute(
          `SELECT id, first_name, last_name, partner_name FROM tournament_registrations WHERE id IN (${placeholders})`,
          ids
        ) as any[];
        regs.forEach((reg: any) => {
          registrationsMap.set(reg.id, reg);
        });
      }

      const matchesWithPlayers = matches.map((match: any) => {
        const players1: string[] = [];
        const players2: string[] = [];

        // Игрок 1 пары 1
        if (match.pair1_player1_id) {
          const reg1 = registrationsMap.get(match.pair1_player1_id);
          if (reg1) {
            players1.push(`${reg1.first_name} ${reg1.last_name}`);
          }
        }
        // Игрок 2 пары 1
        if (match.pair1_player2_id) {
          const reg2 = registrationsMap.get(match.pair1_player2_id);
          if (reg2) {
            players1.push(`${reg2.first_name} ${reg2.last_name}`);
          }
        }

        // Игрок 1 пары 2
        if (match.pair2_player1_id) {
          const reg3 = registrationsMap.get(match.pair2_player1_id);
          if (reg3) {
            players2.push(`${reg3.first_name} ${reg3.last_name}`);
          }
        }
        // Игрок 2 пары 2
        if (match.pair2_player2_id) {
          const reg4 = registrationsMap.get(match.pair2_player2_id);
          if (reg4) {
            players2.push(`${reg4.first_name} ${reg4.last_name}`);
          }
        }

        return { ...match, pair1_players: players1, pair2_players: players2 };
      });

      return NextResponse.json({ matches: matchesWithPlayers });
    }
  } catch (error: any) {
    console.error('Error fetching schedule:', {
      error: error.message,
      stack: error.stack,
      tournamentId: tournamentId || undefined,
      category: category || undefined,
      groupId: groupId || undefined,
    });
    
    // Логируем ошибку в audit log
    try {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;
      if (token) {
        const session = await getSession(token);
        if (session) {
          const user = await findUserById(session.userId);
          await logAction('error', 'schedule', {
            userId: session.userId,
            userEmail: user?.email,
            userRole: session.role,
            entityId: tournamentId || undefined,
            details: {
              error: error.message,
              action: 'fetch_schedule',
              category: category || undefined,
              groupId,
            },
            ipAddress: getIpAddress(request),
            userAgent: getUserAgent(request),
          });
        }
      }
    } catch (logError) {
      // Игнорируем ошибки логирования
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch schedule',
        matches: [] 
      },
      { status: 500 }
    );
  }
}

// POST - сгенерировать расписание для всех категорий (только для superadmin/staff)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let tournamentId: number | null = null;
  try {
    // Проверка авторизации
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
    tournamentId = parseInt(id, 10);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const body = await request.json();
    const { availableCourts, matchDurationMinutes, breakMinutes, timeSlots, startTime } = body; // Поддержка старого формата

    const pool = getDbPool();
    
    // Получаем настройки турнира
    const [tournaments] = await pool.execute(
      'SELECT available_courts, start_date FROM tournaments WHERE id = ?',
      [tournamentId]
    ) as any[];

    if (tournaments.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const tournament = tournaments[0];
    const courts = availableCourts || tournament.available_courts || 3;
    const duration = matchDurationMinutes || 45;
    const breakTime = breakMinutes || 15;

    // Поддержка нового формата (timeSlots) и старого (startTime)
    let timeSlotsArray: Array<{ date: string; startTime: string; endTime: string }> = [];
    if (timeSlots && Array.isArray(timeSlots) && timeSlots.length > 0) {
      timeSlotsArray = timeSlots;
    } else if (startTime) {
      // Старый формат - один временной промежуток
      const startDate = new Date(startTime);
      const endDate = new Date(startDate);
      endDate.setHours(22, 0, 0); // По умолчанию до 22:00
      timeSlotsArray = [{
        date: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
      }];
    } else {
      return NextResponse.json({ error: 'Time slots or start time required' }, { status: 400 });
    }

    // Генерируем расписание для всех категорий с множественными временными промежутками
    const { generateTournamentScheduleForAllCategoriesWithTimeSlots } = await import('@/lib/schedule-time-slots');
    
    console.log('[Schedule Generation] Starting generation:', {
      tournamentId,
      courts,
      duration,
      breakTime,
      timeSlotsCount: timeSlotsArray.length,
      timeSlots: timeSlotsArray,
    });

    let schedule;
    try {
      schedule = await generateTournamentScheduleForAllCategoriesWithTimeSlots(
        tournamentId,
        courts,
        duration,
        breakTime,
        timeSlotsArray
      );
      console.log('[Schedule Generation] Generated successfully:', {
        matchesCount: schedule.length,
      });
    } catch (genError: any) {
      console.error('[Schedule Generation] Error in generation function:', {
        error: genError.message,
        stack: genError.stack,
        tournamentId,
        courts,
        duration,
        breakTime,
      });
      throw genError;
    }

    // Сохраняем в БД
    const { saveSchedule } = await import('@/lib/schedule');
    await saveSchedule(schedule);

    // Логируем действие
    const user = await findUserById(session.userId);
    await logAction('generate', 'schedule', {
      userId: session.userId,
      userEmail: user?.email,
      userRole: session.role,
      entityId: tournamentId,
      details: {
        matchesGenerated: schedule.length,
        availableCourts: courts,
        matchDurationMinutes: duration,
        breakMinutes: breakTime,
        timeSlots: timeSlotsArray,
      },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ 
      success: true, 
      matchesGenerated: schedule.length,
      schedule: schedule.map(m => ({
        groupId: m.groupId,
        pair1Id: m.pair1Id,
        pair2Id: m.pair2Id,
        matchDate: m.matchDate,
        courtNumber: m.courtNumber,
      }))
    });
  } catch (error: any) {
    console.error('Error generating schedule:', error);
    
    // Логируем ошибку
    try {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;
      if (token) {
        const session = await getSession(token);
        if (session) {
          const user = await findUserById(session.userId);
          await logAction('error', 'schedule', {
            userId: session.userId,
            userEmail: user?.email,
            userRole: session.role,
            entityId: tournamentId || undefined,
            details: {
              error: error.message,
              stack: error.stack,
            },
            ipAddress: getIpAddress(request),
            userAgent: getUserAgent(request),
          });
        }
      }
    } catch (logError) {
      // Игнорируем ошибки логирования
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate schedule' },
      { status: 500 }
    );
  }
}

// DELETE - очистить расписание турнира (только для superadmin/staff)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let tournamentId: number | null = null;
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
    tournamentId = parseInt(id, 10);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const pool = getDbPool();

    // Удаляем все матчи для групп этого турнира
    const [result] = await pool.execute(
      `DELETE m FROM tournament_matches m
       JOIN tournament_groups g ON m.group_id = g.id
       WHERE g.tournament_id = ?`,
      [tournamentId]
    ) as any[];

    const deletedCount = result.affectedRows || 0;

    // Логируем действие
    const user = await findUserById(session.userId);
    await logAction('delete', 'schedule', {
      userId: session.userId,
      userEmail: user?.email,
      userRole: session.role,
      entityId: tournamentId,
      details: {
        deletedMatches: deletedCount,
      },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Schedule cleared successfully',
      deletedMatches: deletedCount
    });
  } catch (error: any) {
    console.error('Error clearing schedule:', error);
    
    // Логируем ошибку
    try {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;
      if (token) {
        const session = await getSession(token);
        if (session) {
          const user = await findUserById(session.userId);
          await logAction('error', 'schedule', {
            userId: session.userId,
            userEmail: user?.email,
            userRole: session.role,
            entityId: tournamentId || undefined,
            details: {
              error: error.message,
              action: 'clear_schedule',
            },
            ipAddress: getIpAddress(request),
            userAgent: getUserAgent(request),
          });
        }
      }
    } catch (logError) {
      // Игнорируем ошибки логирования
    }

    return NextResponse.json(
      { error: error.message || 'Failed to clear schedule' },
      { status: 500 }
    );
  }
}
