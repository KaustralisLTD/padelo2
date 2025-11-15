import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

/**
 * POST - создать регистрацию напрямую для админа (без подтверждения email)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const { firstName, lastName, email, categories, partnerName, partnerEmail, confirmed = true } = body;

    if (!firstName || !lastName || !email || !categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'firstName, lastName, email, and categories are required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Создаем регистрацию напрямую в БД
    const [result] = await pool.execute(
      `INSERT INTO tournament_registrations 
       (tournament_id, first_name, last_name, email, categories, partner_name, partner_email, confirmed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        tournamentId,
        firstName,
        lastName,
        email,
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

