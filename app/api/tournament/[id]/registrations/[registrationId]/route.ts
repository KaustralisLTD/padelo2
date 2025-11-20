import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update registration' },
      { status: 500 }
    );
  }
}

