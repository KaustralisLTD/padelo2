import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { saveMatchResult } from '@/lib/matches';
import { checkAndAdvanceWinners } from '@/lib/knockout';
import { getDbPool } from '@/lib/db';

/**
 * POST - сохранить результат матча
 */
export async function POST(
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

    const body = await request.json();
    const { groupId, pair1Id, pair2Id, pair1Games, pair2Games } = body;

    if (!groupId || !pair1Id || !pair2Id || pair1Games === undefined || pair2Games === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (pair1Games < 0 || pair2Games < 0 || pair1Games > 9 || pair2Games > 9) {
      return NextResponse.json(
        { error: 'Invalid games score (must be 0-9)' },
        { status: 400 }
      );
    }

    const match = await saveMatchResult(
      groupId,
      pair1Id,
      pair2Id,
      pair1Games,
      pair2Games,
      session.userId
    );

    // Check if group is completed and advance winners to next stage
    const pool = getDbPool();
    const [group] = await pool.execute(
      'SELECT tournament_id, category FROM tournament_groups WHERE id = ?',
      [groupId]
    ) as any[];
    
    if (group.length > 0) {
      const advancement = await checkAndAdvanceWinners(
        group[0].tournament_id,
        group[0].category
      );
      
      return NextResponse.json({ 
        match,
        advancement: advancement.advanced ? {
          nextStage: advancement.nextStage,
          message: `Winners advanced to ${advancement.nextStage}`
        } : null
      });
    }

    return NextResponse.json({ match });
  } catch (error: any) {
    console.error('Error saving match result:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save match result' },
      { status: 500 }
    );
  }
}

