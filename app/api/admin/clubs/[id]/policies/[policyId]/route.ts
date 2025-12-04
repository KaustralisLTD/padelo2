import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';
import { checkClubAccessFromSession } from '@/lib/club-access';

export const dynamic = 'force-dynamic';

// GET - получить информацию о политике
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; policyId: string }> }
) {
  try {
    const { id, policyId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const access = await checkClubAccessFromSession(token, parseInt(id));
    if (!access.authorized && session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. You do not have access to this club.' }, { status: 403 });
    }

    const pool = getDbPool();
    const [policies] = await pool.execute(
      `SELECT id, club_id, type, title, content, is_active, created_at, updated_at
       FROM policies
       WHERE id = ? AND club_id = ?`,
      [policyId, id]
    ) as any[];

    if (policies.length === 0) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    return NextResponse.json({ policy: policies[0] });
  } catch (error: any) {
    console.error('Error fetching policy:', error);
    return NextResponse.json({ error: 'Failed to fetch policy' }, { status: 500 });
  }
}

// PUT - обновить политику
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; policyId: string }> }
) {
  try {
    const { id, policyId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const access = await checkClubAccessFromSession(token, parseInt(id), 'admin');
    if (!access.authorized && session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. You do not have access to manage policies for this club.' }, { status: 403 });
    }

    const body = await request.json();
    const { type, title, content, isActive } = body;

    if (!type || !title || !content) {
      return NextResponse.json({ error: 'Policy type, title and content are required' }, { status: 400 });
    }

    const pool = getDbPool();
    await pool.execute(
      `UPDATE policies
       SET type = ?, title = ?, content = ?, is_active = ?, updated_at = NOW()
       WHERE id = ? AND club_id = ?`,
      [
        type,
        title,
        content,
        isActive !== undefined ? isActive : true,
        policyId,
        id,
      ]
    );

    const currentUser = await findUserById(session.userId);

    await logAction('update', 'policy', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: policyId,
      details: { clubId: id, type, title },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating policy:', error);
    return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 });
  }
}

// DELETE - удалить политику
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; policyId: string }> }
) {
  try {
    const { id, policyId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const access = await checkClubAccessFromSession(token, parseInt(id), 'admin');
    if (!access.authorized && session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. You do not have access to manage policies for this club.' }, { status: 403 });
    }

    const pool = getDbPool();
    
    const [policies] = await pool.execute(
      'SELECT title FROM policies WHERE id = ? AND club_id = ?',
      [policyId, id]
    ) as any[];

    if (policies.length === 0) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    await pool.execute('DELETE FROM policies WHERE id = ? AND club_id = ?', [policyId, id]);

    const currentUser = await findUserById(session.userId);

    await logAction('delete', 'policy', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: policyId,
      details: { clubId: id, title: policies[0].title },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting policy:', error);
    return NextResponse.json({ error: 'Failed to delete policy' }, { status: 500 });
  }
}

