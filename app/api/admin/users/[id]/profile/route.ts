import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pool = getDbPool();
    
    // Получаем полный профиль пользователя
    const [users] = await pool.execute(
      `SELECT 
        id, email, first_name, last_name, role, phone, telegram, 
        date_of_birth, tshirt_size, photo_name, created_at, updated_at
      FROM users 
      WHERE id = ? OR email = ?`,
      [userId, userId]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Получаем статистику
    const [stats] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM tournament_registrations WHERE email = ?) as total_registrations,
        (SELECT COUNT(*) FROM tournament_registrations WHERE email = ? AND confirmed = 1) as confirmed_registrations,
        (SELECT COUNT(*) FROM tournament_matches tm
         JOIN tournament_group_pairs tgp1 ON tm.pair1_id = tgp1.id
         JOIN tournament_group_pairs tgp2 ON tm.pair2_id = tgp2.id
         JOIN tournament_registrations tr1 ON tgp1.player1_registration_id = tr1.id
         JOIN tournament_registrations tr2 ON tgp2.player1_registration_id = tr2.id
         WHERE tr1.email = ? OR tr2.email = ?) as total_matches
    `, [user.email, user.email, user.email, user.email]) as any[];

    const statsData = stats[0] || { total_registrations: 0, confirmed_registrations: 0, total_matches: 0 };

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        telegram: user.telegram,
        dateOfBirth: user.date_of_birth ? user.date_of_birth.toISOString().split('T')[0] : null,
        tshirtSize: user.tshirt_size,
        photoName: user.photo_name,
        createdAt: user.created_at ? user.created_at.toISOString() : new Date().toISOString(),
        updatedAt: user.updated_at ? user.updated_at.toISOString() : null,
      },
      stats: {
        totalRegistrations: parseInt(statsData.total_registrations) || 0,
        confirmedRegistrations: parseInt(statsData.confirmed_registrations) || 0,
        totalMatches: parseInt(statsData.total_matches) || 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

