import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

/**
 * GET - получить список доступных игроков для турнира (по категории)
 */
export async function GET(
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Superadmin имеет доступ ко всем турнирам
    if (session.role === 'superadmin') {
      // Продолжаем выполнение
    } else {
      // Для других ролей проверяем доступ к конкретному турниру
      const { checkTournamentAccess } = await import('@/lib/tournament-access');
      const access = await checkTournamentAccess(token, tournamentId, 'canViewRegistrations');
      
      if (!access.authorized) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { id } = await params;
    const tournamentId = parseInt(id, 10);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const pool = getDbPool();

    // Получаем все регистрации для турнира (опционально по категории)
    let query = `
      SELECT 
        id,
        first_name,
        last_name,
        email,
        partner_name,
        partner_email,
        categories
      FROM tournament_registrations
      WHERE tournament_id = ? AND confirmed = 1
    `;
    const paramsArray: any[] = [tournamentId];

    if (category) {
      // Фильтруем по категории (categories хранится как JSON массив)
      query += ` AND JSON_CONTAINS(categories, ?)`;
      paramsArray.push(JSON.stringify(category));
    }

    query += ` ORDER BY first_name, last_name`;

    const [registrations] = await pool.execute(query, paramsArray) as any[];

    // Формируем список игроков
    const players: any[] = [];

    for (const reg of registrations) {
      // Основной игрок
      players.push({
        registrationId: reg.id,
        firstName: reg.first_name,
        lastName: reg.last_name,
        email: reg.email,
        isPartner: false,
        fullName: `${reg.first_name} ${reg.last_name}`,
      });

      // Партнер (если есть)
      if (reg.partner_name && reg.partner_email) {
        players.push({
          registrationId: reg.id, // Тот же registration_id, но это партнер
          firstName: reg.partner_name,
          lastName: '',
          email: reg.partner_email,
          isPartner: true,
          fullName: reg.partner_name,
        });
      }
    }

    return NextResponse.json({ players });
  } catch (error: any) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

