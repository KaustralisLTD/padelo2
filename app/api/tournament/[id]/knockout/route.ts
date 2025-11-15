import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { checkAndAdvanceWinners } from '@/lib/knockout';

/**
 * POST - запустить финальную часть (knockout stage)
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

    const { id } = await params;
    const tournamentId = parseInt(id, 10);
    const body = await request.json();
    const { category } = body;

    if (!category) {
      return NextResponse.json(
        { error: 'category is required' },
        { status: 400 }
      );
    }

    const advancement = await checkAndAdvanceWinners(tournamentId, category);

    if (!advancement.advanced) {
      const reason = advancement.reason || 'Not all groups are completed or next stage already exists.';
      console.error(`[Knockout API] Cannot start knockout stage for tournament ${tournamentId}, category ${category}. Reason: ${reason}`);
      return NextResponse.json(
        { error: `Cannot start knockout stage. ${reason}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      nextStage: advancement.nextStage,
      groupIds: advancement.groupIds,
    });
  } catch (error: any) {
    console.error('Error starting knockout stage:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start knockout stage' },
      { status: 500 }
    );
  }
}

