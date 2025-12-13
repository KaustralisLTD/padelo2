import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import crypto from 'crypto';

// Helper function to get or create user by email
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
    const userId = crypto.randomBytes(16).toString('hex');
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

/**
 * GET - получить все регистрации турнира
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Получаем tournamentId сразу, чтобы использовать его в проверке доступа
    const { id } = await params;
    const tournamentId = parseInt(id, 10);

    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

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

    const pool = getDbPool();

    // Проверяем наличие колонки category_partners
    let hasCategoryPartners = false;
    try {
      const [columns] = await pool.execute(
        `SELECT COLUMN_NAME 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'tournament_registrations' 
         AND COLUMN_NAME = 'category_partners'`
      ) as any[];
      hasCategoryPartners = columns.length > 0;
    } catch (e) {
      console.warn('Could not check for category_partners column:', e);
    }

    const categoryPartnersSelect = hasCategoryPartners ? 'tr.category_partners,' : 'NULL as category_partners,';
    
    const [registrations] = await pool.execute(
      `SELECT 
        tr.id,
        tr.user_id,
        tr.first_name,
        tr.last_name,
        tr.email,
        tr.phone,
        tr.telegram,
        tr.tshirt_size,
        tr.message,
        tr.partner_name,
        tr.partner_email,
        tr.partner_phone,
        tr.partner_tshirt_size,
        tr.parent_user_id,
        parent.first_name as parent_first_name,
        parent.last_name as parent_last_name,
        ${categoryPartnersSelect}
        tr.categories,
        tr.confirmed,
        tr.token,
        tr.payment_status,
        tr.payment_date,
        tr.registration_type,
        tr.adults_count,
        tr.children_count,
        tr.guest_children,
        tr.locale,
        tr.created_at
      FROM tournament_registrations tr
      LEFT JOIN tournament_registrations parent ON tr.parent_user_id = parent.user_id
      WHERE tr.tournament_id = ?
      ORDER BY tr.created_at ASC`,
      [tournamentId]
    ) as any[];

    // Создаем user_id для регистраций без него
    for (const reg of registrations) {
      if (!reg.user_id && reg.email) {
        try {
          const userId = await getOrCreateUserByEmail(
            reg.email,
            reg.first_name || '',
            reg.last_name || ''
          );
          if (userId) {
            // Обновляем регистрацию с новым user_id
            await pool.execute(
              'UPDATE tournament_registrations SET user_id = ? WHERE id = ?',
              [userId, reg.id]
            );
            reg.user_id = userId;
            console.log(`[registrations] Created user_id ${userId} for registration ${reg.id}`);
          }
        } catch (error) {
          console.error(`[registrations] Error creating user_id for registration ${reg.id}:`, error);
        }
      }
    }

    const formatted = registrations.map((reg: any, index: number) => {
      let categories = [];
      try {
        categories = reg.categories ? (typeof reg.categories === 'string' ? JSON.parse(reg.categories) : reg.categories) : [];
      } catch (e) {
        console.error('Error parsing categories for registration', reg.id, e);
        categories = [];
      }

      let categoryPartners = {};
      try {
        categoryPartners = reg.category_partners ? (typeof reg.category_partners === 'string' ? JSON.parse(reg.category_partners) : reg.category_partners) : {};
      } catch (e) {
        console.error('Error parsing category_partners for registration', reg.id, e);
        categoryPartners = {};
      }

      let guestChildren = null;
      try {
        if (reg.guest_children) {
          guestChildren = typeof reg.guest_children === 'string' ? JSON.parse(reg.guest_children) : reg.guest_children;
        }
      } catch (e) {
        console.error('Error parsing guest_children for registration', reg.id, e);
        guestChildren = null;
      }

      return {
        id: reg.id,
        userId: reg.user_id || null,
        firstName: reg.first_name,
        lastName: reg.last_name,
        email: reg.email,
        phone: reg.phone,
        telegram: reg.telegram,
        tshirtSize: reg.tshirt_size,
        message: reg.message,
        parentUserId: reg.parent_user_id || null,
        parentName: reg.parent_first_name && reg.parent_last_name 
          ? `${reg.parent_first_name} ${reg.parent_last_name}` 
          : null,
        partnerName: reg.partner_name,
        partnerEmail: reg.partner_email,
        partnerPhone: reg.partner_phone,
        partnerTshirtSize: reg.partner_tshirt_size,
        categoryPartners,
        categories,
        confirmed: !!reg.confirmed,
        token: reg.token,
        paymentStatus: reg.payment_status || 'pending',
        paymentDate: reg.payment_date ? new Date(reg.payment_date).toISOString() : undefined,
        locale: reg.locale || 'en',
        registrationType: reg.registration_type || 'participant',
        adultsCount: reg.adults_count || null,
        childrenCount: reg.children_count || null,
        guestChildren: guestChildren,
        createdAt: reg.created_at.toISOString(),
        orderNumber: index + 1,
        isDemo: reg.token?.startsWith(`demo-${tournamentId}-`) || false,
      };
    });

    return NextResponse.json({ registrations: formatted });
  } catch (error: any) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - обновить категорию регистрации
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Получаем tournamentId сразу, чтобы использовать его в проверке доступа
    const { id } = await params;
    const tournamentId = parseInt(id, 10);

    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

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
      // Для других ролей проверяем доступ к конкретному турниру (для редактирования нужен canManageTournaments)
      const { checkTournamentAccess } = await import('@/lib/tournament-access');
      const access = await checkTournamentAccess(token, tournamentId, 'canManageTournaments');
      
      if (!access.authorized) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { registrationId, categories } = body;

    if (!registrationId || !Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'registrationId and categories array are required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Проверяем, что регистрация принадлежит этому турниру
    const [check] = await pool.execute(
      'SELECT id FROM tournament_registrations WHERE id = ? AND tournament_id = ?',
      [registrationId, tournamentId]
    ) as any[];

    if (check.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Обновляем категории
    await pool.execute(
      'UPDATE tournament_registrations SET categories = ? WHERE id = ?',
      [JSON.stringify(categories), registrationId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating registration category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update registration category' },
      { status: 500 }
    );
  }
}

