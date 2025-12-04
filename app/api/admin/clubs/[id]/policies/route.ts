import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getSession, findUserById } from '@/lib/users';
import { logAction, getIpAddress, getUserAgent } from '@/lib/audit-log';
import { checkClubAccessFromSession } from '@/lib/club-access';

export const dynamic = 'force-dynamic';

// GET - получить список политик клуба
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
       WHERE club_id = ?
       ORDER BY type, title ASC`,
      [id]
    ) as any[];

    return NextResponse.json({ policies });
  } catch (error: any) {
    console.error('Error fetching policies:', error);
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
}

// POST - создать новую политику
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    
    const [clubs] = await pool.execute('SELECT name FROM clubs WHERE id = ?', [id]) as any[];
    if (clubs.length === 0) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    const [result] = await pool.execute(
      `INSERT INTO policies (club_id, type, title, content, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        id,
        type,
        title,
        content,
        isActive !== undefined ? isActive : true,
      ]
    ) as any[];

    const policyId = (result as any).insertId;

    const currentUser = await findUserById(session.userId);

    await logAction('create', 'policy', {
      userId: session.userId,
      userEmail: currentUser?.email,
      userRole: session.role,
      entityId: policyId,
      details: { clubId: id, clubName: clubs[0].name, type, title },
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    }).catch(() => {});

    return NextResponse.json({ success: true, policyId });
  } catch (error: any) {
    console.error('Error creating policy:', error);
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
  }
}

