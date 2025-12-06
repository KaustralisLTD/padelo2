import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - получить все турниры пользователя (регистрации)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user email
    const pool = getDbPool();
    const [userRows] = await pool.execute(
      'SELECT email FROM users WHERE id = ?',
      [session.userId]
    ) as any[];

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userEmail = userRows[0].email;

    // Get all registrations for this user (by email and user_id)
    const [registrations] = await pool.execute(
      `SELECT 
        tr.id,
        tr.tournament_id,
        tr.tournament_name,
        tr.categories,
        tr.confirmed,
        tr.confirmed_at,
        tr.created_at,
        t.start_date,
        t.end_date,
        t.status as tournament_status,
        t.location
       FROM tournament_registrations tr
       LEFT JOIN tournaments t ON tr.tournament_id = t.id
       WHERE tr.email = ? OR tr.user_id = ?
       ORDER BY tr.created_at DESC`,
      [userEmail, session.userId]
    ) as any[];

    const tournaments = registrations.map((row: any) => {
      // Безопасный парсинг categories - может быть JSON массив или строка
      let categories: string[] = [];
      try {
        if (row.categories) {
          if (typeof row.categories === 'string') {
            // Пытаемся распарсить как JSON
            try {
              const parsed = JSON.parse(row.categories);
              categories = Array.isArray(parsed) ? parsed : typeof parsed === 'string' ? [parsed] : [];
            } catch (jsonError) {
              // Если не JSON, значит это строка - преобразуем в массив
              categories = [row.categories];
            }
          } else if (Array.isArray(row.categories)) {
            categories = row.categories;
          }
        }
      } catch (e) {
        console.error(`[user/tournaments] Error parsing categories for registration ${row.id}:`, e);
        categories = [];
      }

      return {
        id: row.id,
        tournamentId: row.tournament_id,
        tournamentName: row.tournament_name,
        categories,
        confirmed: !!row.confirmed,
        confirmedAt: row.confirmed_at ? row.confirmed_at.toISOString() : null,
        createdAt: row.created_at.toISOString(),
        startDate: row.start_date ? row.start_date.toISOString() : null,
        endDate: row.end_date ? row.end_date.toISOString() : null,
        tournamentStatus: row.tournament_status,
        location: row.location,
      };
    });

    return NextResponse.json({ tournaments });
  } catch (error: any) {
    console.error('Error getting user tournaments:', error);
    if (error.message?.includes('not configured')) {
      // Database not configured, return empty array
      return NextResponse.json({ tournaments: [] });
    }
    return NextResponse.json({ error: 'Failed to get tournaments' }, { status: 500 });
  }
}

