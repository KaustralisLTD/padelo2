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

/**
 * POST - создать регистрацию напрямую для админа (без подтверждения email)
 */
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
    const tournamentId = parseInt(id, 10);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const body = await request.json();
    let { firstName, lastName, email, phone, telegram, categories, partnerName, partnerEmail, confirmed = true, userId } = body;

    // Валидация: хотя бы одно поле должно быть заполнено (имя, телефон или телеграм)
    const hasName = firstName || lastName;
    const hasPhone = phone && phone.trim();
    const hasTelegram = telegram && telegram.trim();
    
    if (!hasName && !hasPhone && !hasTelegram) {
      return NextResponse.json(
        { error: 'At least one field must be filled: name, phone, or telegram' },
        { status: 400 }
      );
    }

    // Если нет имени, используем телефон или телеграм как имя
    if (!firstName && !lastName) {
      firstName = phone || telegram || 'Участник';
      lastName = '';
    } else if (!firstName) {
      firstName = lastName;
      lastName = '';
    } else if (!lastName) {
      lastName = '';
    }

    // Если нет email, создаем временный email на основе телефона или телеграма
    if (!email) {
      if (phone) {
        email = `temp_${phone.replace(/\D/g, '')}@manual.padelo2.com`;
      } else if (telegram) {
        email = `temp_${telegram.replace(/[^a-zA-Z0-9]/g, '')}@manual.padelo2.com`;
      } else {
        email = `temp_${Date.now()}@manual.padelo2.com`;
      }
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: 'categories array is required and must not be empty' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Если userId не передан, получаем или создаем его по email
    if (!userId && email) {
      userId = await getOrCreateUserByEmail(email, firstName, lastName);
    }

    // Создаем регистрацию напрямую в БД
    const [result] = await pool.execute(
      `INSERT INTO tournament_registrations 
       (tournament_id, user_id, first_name, last_name, email, phone, telegram, categories, partner_name, partner_email, confirmed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        tournamentId,
        userId || null,
        firstName,
        lastName,
        email,
        phone || null,
        telegram || null,
        JSON.stringify(categories),
        partnerName || null,
        partnerEmail || null,
        confirmed ? 1 : 0,
      ]
    ) as any[];

    const registrationId = result.insertId;

    return NextResponse.json({
      success: true,
      registrationId,
      id: registrationId,
    });
  } catch (error: any) {
    console.error('Error creating registration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create registration' },
      { status: 500 }
    );
  }
}

