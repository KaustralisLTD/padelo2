import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getDbPool } from '@/lib/db';

// GET - получить правила турнира
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; const tournamentId = parseInt(id, 10);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const pool = getDbPool();
    const [tournaments] = await pool.execute(
      'SELECT id, name, rules FROM tournaments WHERE id = ?',
      [tournamentId]
    ) as any[];

    if (tournaments.length === 0) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const tournament = tournaments[0];
    const rules = tournament.rules ? JSON.parse(tournament.rules) : null;

    return NextResponse.json({ rules });
  } catch (error: any) {
    console.error('Error fetching tournament rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}

// PUT - обновить правила турнира (только для superadmin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверка авторизации
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params; const tournamentId = parseInt(id, 10);
    if (isNaN(tournamentId)) {
      return NextResponse.json({ error: 'Invalid tournament ID' }, { status: 400 });
    }

    const body = await request.json();
    const { rules } = body;

    if (!rules || typeof rules !== 'object') {
      return NextResponse.json({ error: 'Invalid rules data' }, { status: 400 });
    }

    const pool = getDbPool();
    await pool.execute(
      'UPDATE tournaments SET rules = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(rules), tournamentId]
    );

    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    console.error('Error updating tournament rules:', error);
    return NextResponse.json(
      { error: 'Failed to update rules' },
      { status: 500 }
    );
  }
}

