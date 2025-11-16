import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { createMissingMatchesForGroup } from '@/lib/matches';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
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

    const { id, groupId } = await params;
    const tournamentId = parseInt(id, 10);
    const groupIdNum = parseInt(groupId, 10);

    if (isNaN(tournamentId) || isNaN(groupIdNum)) {
      return NextResponse.json({ error: 'Invalid tournament or group ID' }, { status: 400 });
    }

    // Verify that the group belongs to this tournament
    const pool = getDbPool();
    const [groupInfo] = await pool.execute(
      'SELECT id, tournament_id, group_name FROM tournament_groups WHERE id = ? AND tournament_id = ?',
      [groupIdNum, tournamentId]
    ) as any[];

    if (groupInfo.length === 0) {
      return NextResponse.json({ error: 'Group not found or does not belong to this tournament' }, { status: 404 });
    }

    // Create missing matches
    const result = await createMissingMatchesForGroup(groupIdNum);

    return NextResponse.json({
      success: true,
      created: result.created,
      matches: result.matches,
      message: `Created ${result.created} missing matches for ${groupInfo[0].group_name}`
    });
  } catch (error: any) {
    console.error('[Create Matches API] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create matches',
        created: 0,
        matches: []
      },
      { status: 500 }
    );
  }
}

