import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

// GET - получить документ
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ termId: string }> }
) {
  try {
    const { termId } = await params;
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
       WHERE id = ?`,
      [termId]
    ) as any[];

    if (terms.length === 0) {
      return NextResponse.json({ error: 'Term not found' }, { status: 404 });
    }

    return NextResponse.json({ term: terms[0] });
  } catch (error: any) {
    console.error('Error fetching term:', error);
    return NextResponse.json({ error: 'Failed to fetch term' }, { status: 500 });
  }
}

// PUT - обновить документ
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ termId: string }> }
) {
  try {
    const { termId } = await params;
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
    await pool.execute(
      `UPDATE terms
       SET type = ?, title = ?, content = ?, version = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        type,
        title,
        content,
        version || null,
        isActive !== undefined ? isActive : true,
        termId,
      ]
    );

    const currentUser = await findUserById(session.userId);

    await logAction('update', 'term', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: termId,
      details: { type, title, version },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating term:', error);
    return NextResponse.json({ error: 'Failed to update term' }, { status: 500 });
  }
}

// DELETE - удалить документ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ termId: string }> }
) {
  try {
    const { termId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. Only superadmin can manage terms.' }, { status: 403 });
    }

    const pool = getDbPool();
    
    const [terms] = await pool.execute(
      'SELECT title FROM terms WHERE id = ?',
      [termId]
    ) as any[];

    if (terms.length === 0) {
      return NextResponse.json({ error: 'Term not found' }, { status: 404 });
    }

    await pool.execute('DELETE FROM terms WHERE id = ?', [termId]);

    const currentUser = await findUserById(session.userId);

    await logAction('delete', 'term', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: termId,
      details: { title: terms[0].title },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting term:', error);
    return NextResponse.json({ error: 'Failed to delete term' }, { status: 500 });
  }
}

