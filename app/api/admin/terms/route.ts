import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

// GET - получить список документов
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || (session.role !== 'superadmin' && session.role !== 'tournament_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pool = getDbPool();
    const [terms] = await pool.execute(
      `SELECT id, type, title, content, version, is_active, created_at, updated_at
       FROM terms
       ORDER BY type, created_at DESC`
    ) as any[];

    return NextResponse.json({ terms });
  } catch (error: any) {
    console.error('Error fetching terms:', error);
    return NextResponse.json({ error: 'Failed to fetch terms' }, { status: 500 });
  }
}

// POST - создать новый документ
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. Only superadmin can manage terms.' }, { status: 403 });
    }

    const body = await request.json();
    const { type, title, content, version, isActive } = body;

    if (!type || !title || !content) {
      return NextResponse.json({ error: 'Type, title and content are required' }, { status: 400 });
    }

    const pool = getDbPool();
    const [result] = await pool.execute(
      `INSERT INTO terms (type, title, content, version, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        type,
        title,
        content,
        version || null,
        isActive !== undefined ? isActive : true,
      ]
    ) as any[];

    const termId = (result as any).insertId;

    const currentUser = await findUserById(session.userId);

    await logAction('create', 'term', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: termId.toString(),
      details: { type, title, version },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true, termId });
  } catch (error: any) {
    console.error('Error creating term:', error);
    return NextResponse.json({ error: 'Failed to create term' }, { status: 500 });
  }
}

