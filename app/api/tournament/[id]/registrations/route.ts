import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

/**
 * GET - получить все регистрации турнира
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
    if (session?.role !== 'superadmin' && session?.role !== 'staff') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const tournamentId = parseInt(id, 10);

    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const pool = getDbPool();

    const [registrations] = await pool.execute(
      `SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        telegram,
        tshirt_size,
        message,
        partner_name,
        partner_email,
        partner_phone,
        partner_tshirt_size,
        categories,
        confirmed,
        token,
        payment_status,
        payment_date,
        created_at
      FROM tournament_registrations
      WHERE tournament_id = ?
      ORDER BY created_at DESC`,
      [tournamentId]
    ) as any[];

    const formatted = registrations.map((reg: any) => {
      let categories = [];
      try {
        categories = reg.categories ? (typeof reg.categories === 'string' ? JSON.parse(reg.categories) : reg.categories) : [];
      } catch (e) {
        console.error('Error parsing categories for registration', reg.id, e);
        categories = [];
      }

      return {
        id: reg.id,
        firstName: reg.first_name,
        lastName: reg.last_name,
        email: reg.email,
        phone: reg.phone,
        telegram: reg.telegram,
        tshirtSize: reg.tshirt_size,
        message: reg.message,
        partnerName: reg.partner_name,
        partnerEmail: reg.partner_email,
        partnerPhone: reg.partner_phone,
        partnerTshirtSize: reg.partner_tshirt_size,
        categories,
        confirmed: !!reg.confirmed,
        token: reg.token,
        paymentStatus: reg.payment_status || 'pending',
        paymentDate: reg.payment_date ? new Date(reg.payment_date).toISOString() : undefined,
        createdAt: reg.created_at.toISOString(),
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

