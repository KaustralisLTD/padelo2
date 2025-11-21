import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';
import crypto from 'crypto';

// Helper function to get or create user by email, name, or phone
async function getOrCreateUserByPartnerInfo(
  partnerName: string,
  partnerEmail?: string,
  partnerPhone?: string
): Promise<string | null> {
  try {
    const pool = getDbPool();
    
    if (!partnerName) return null;
    
    // Разбиваем имя на firstName и lastName
    const nameParts = partnerName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Ищем существующего пользователя по email, телефону или имени
    let existingUserId: string | null = null;
    
    if (partnerEmail) {
      const [usersByEmail] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [partnerEmail]
      ) as any[];
      if (usersByEmail.length > 0) {
        existingUserId = usersByEmail[0].id;
      }
    }
    
    if (!existingUserId && partnerPhone) {
      // Ищем по телефону через регистрации
      const [registrationsByPhone] = await pool.execute(
        'SELECT user_id FROM tournament_registrations WHERE phone = ? AND user_id IS NOT NULL LIMIT 1',
        [partnerPhone]
      ) as any[];
      if (registrationsByPhone.length > 0 && registrationsByPhone[0].user_id) {
        existingUserId = registrationsByPhone[0].user_id;
      }
    }
    
    if (!existingUserId && firstName && lastName) {
      // Ищем по имени и фамилии через регистрации
      const [registrationsByName] = await pool.execute(
        'SELECT user_id FROM tournament_registrations WHERE first_name = ? AND last_name = ? AND user_id IS NOT NULL LIMIT 1',
        [firstName, lastName]
      ) as any[];
      if (registrationsByName.length > 0 && registrationsByName[0].user_id) {
        existingUserId = registrationsByName[0].user_id;
      }
    }
    
    if (existingUserId) {
      return existingUserId;
    }
    
    // Создаем нового пользователя
    const userId = crypto.randomBytes(16).toString('hex');
    const defaultPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = crypto.createHash('sha256').update(defaultPassword).digest('hex');
    
    await pool.execute(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'participant', NOW(), NOW())`,
      [userId, partnerEmail || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@partner.temp`, passwordHash, firstName, lastName]
    );
    
    return userId;
  } catch (error) {
    console.error('Error getting or creating partner user:', error);
    return null;
  }
}

// Helper function to create partner registration if needed
async function ensurePartnerRegistration(
  tournamentId: number,
  partnerName: string,
  partnerEmail?: string,
  partnerPhone?: string,
  partnerTshirtSize?: string
): Promise<number | null> {
  try {
    if (!partnerName) return null;
    
    const pool = getDbPool();
    
    // Проверяем, есть ли уже регистрация для этого партнера в этом турнире
    const nameParts = partnerName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    let existingRegistration: any = null;
    
    if (partnerEmail) {
      const [registrations] = await pool.execute(
        'SELECT id FROM tournament_registrations WHERE tournament_id = ? AND email = ?',
        [tournamentId, partnerEmail]
      ) as any[];
      if (registrations.length > 0) {
        existingRegistration = registrations[0];
      }
    }
    
    if (!existingRegistration && firstName && lastName) {
      const [registrations] = await pool.execute(
        'SELECT id FROM tournament_registrations WHERE tournament_id = ? AND first_name = ? AND last_name = ?',
        [tournamentId, firstName, lastName]
      ) as any[];
      if (registrations.length > 0) {
        existingRegistration = registrations[0];
      }
    }
    
    if (existingRegistration) {
      return existingRegistration.id;
    }
    
    // Создаем регистрацию для партнера
    const partnerUserId = await getOrCreateUserByPartnerInfo(partnerName, partnerEmail, partnerPhone);
    
    const [result] = await pool.execute(
      `INSERT INTO tournament_registrations 
       (tournament_id, user_id, first_name, last_name, email, phone, tshirt_size, confirmed, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        tournamentId,
        partnerUserId,
        firstName,
        lastName,
        partnerEmail || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@partner.temp`,
        partnerPhone || null,
        partnerTshirtSize || null,
      ]
    ) as any[];
    
    return result.insertId;
  } catch (error) {
    console.error('Error ensuring partner registration:', error);
    return null;
  }
}

/**
 * PATCH - обновить данные регистрации
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
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

    const { id, registrationId } = await params;
    const tournamentId = parseInt(id, 10);
    const registrationIdNum = parseInt(registrationId, 10);

    if (isNaN(tournamentId) || isNaN(registrationIdNum)) {
      return NextResponse.json({ error: 'Invalid tournament or registration ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      telegram,
      tshirtSize,
      message,
      partnerName,
      partnerEmail,
      partnerPhone,
      partnerTshirtSize,
      categoryPartners,
      categories,
      paymentStatus,
      paymentDate,
    } = body;

    const pool = getDbPool();

    // Проверяем, что регистрация принадлежит этому турниру
    const [check] = await pool.execute(
      'SELECT id FROM tournament_registrations WHERE id = ? AND tournament_id = ?',
      [registrationIdNum, tournamentId]
    ) as any[];

    if (check.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Формируем UPDATE запрос динамически
    const updates: string[] = [];
    const values: any[] = [];

    if (firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(lastName);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (telegram !== undefined) {
      updates.push('telegram = ?');
      values.push(telegram);
    }
    if (tshirtSize !== undefined) {
      updates.push('tshirt_size = ?');
      values.push(tshirtSize);
    }
    if (message !== undefined) {
      updates.push('message = ?');
      values.push(message);
    }
    if (partnerName !== undefined) {
      updates.push('partner_name = ?');
      values.push(partnerName);
    }
    if (partnerEmail !== undefined) {
      updates.push('partner_email = ?');
      values.push(partnerEmail);
    }
    if (partnerPhone !== undefined) {
      updates.push('partner_phone = ?');
      values.push(partnerPhone);
    }
    if (partnerTshirtSize !== undefined) {
      updates.push('partner_tshirt_size = ?');
      values.push(partnerTshirtSize);
    }
    if (categoryPartners !== undefined) {
      updates.push('category_partners = ?');
      values.push(JSON.stringify(categoryPartners));
    }
    if (categories !== undefined) {
      updates.push('categories = ?');
      values.push(JSON.stringify(categories));
    }
    if (paymentStatus !== undefined) {
      updates.push('payment_status = ?');
      values.push(paymentStatus);
    }
    if (paymentDate !== undefined) {
      updates.push('payment_date = ?');
      values.push(paymentDate);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(registrationIdNum);

    await pool.execute(
      `UPDATE tournament_registrations SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Автоматически создаем регистрацию для партнера, если указан
    if (partnerName) {
      await ensurePartnerRegistration(
        tournamentId,
        partnerName,
        partnerEmail,
        partnerPhone,
        partnerTshirtSize
      );
    }
    
    // Обрабатываем партнеров по категориям
    if (categoryPartners && typeof categoryPartners === 'object') {
      for (const [category, partnerInfo] of Object.entries(categoryPartners)) {
        if (partnerInfo && typeof partnerInfo === 'object' && 'name' in partnerInfo) {
          const partner = partnerInfo as any;
          await ensurePartnerRegistration(
            tournamentId,
            partner.name,
            partner.email,
            partner.phone,
            partner.tshirtSize
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update registration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - удалить регистрацию участника
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
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

    const { id, registrationId } = await params;
    const tournamentId = parseInt(id, 10);
    const registrationIdNum = parseInt(registrationId, 10);

    if (isNaN(tournamentId) || isNaN(registrationIdNum)) {
      return NextResponse.json({ error: 'Invalid tournament or registration ID' }, { status: 400 });
    }

    const pool = getDbPool();

    // Проверяем, что регистрация принадлежит этому турниру
    const [check] = await pool.execute(
      'SELECT id FROM tournament_registrations WHERE id = ? AND tournament_id = ?',
      [registrationIdNum, tournamentId]
    ) as any[];

    if (check.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Удаляем регистрацию
    await pool.execute(
      'DELETE FROM tournament_registrations WHERE id = ? AND tournament_id = ?',
      [registrationIdNum, tournamentId]
    );

    return NextResponse.json({ success: true, message: 'Registration deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting registration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete registration' },
      { status: 500 }
    );
  }
}

