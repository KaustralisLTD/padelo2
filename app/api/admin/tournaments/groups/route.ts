import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import {
  getTournamentGroups,
  createTournamentGroup,
  updateTournamentGroup,
  deleteTournamentGroup,
  autoCreateGroupsForCategory,
} from '@/lib/tournaments';

// GET - получить группы турнира
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || (session.role !== 'superadmin' && session.role !== 'staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const category = searchParams.get('category');

    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    const groups = await getTournamentGroups(parseInt(tournamentId), category || undefined);
    return NextResponse.json({ groups });
  } catch (error: any) {
    console.error('Error getting groups:', error);
    return NextResponse.json({ error: 'Failed to get groups' }, { status: 500 });
  }
}

// POST - создать группу или автоматически создать группы для категории
export async function POST(request: NextRequest) {
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
    const { autoCreate, tournamentId, category, numberOfGroups, pairsPerGroup, ...groupData } = body;

    // Автоматическое создание групп для категории
    if (autoCreate && tournamentId && category) {
      const groups = await autoCreateGroupsForCategory(
        tournamentId,
        category,
        numberOfGroups || 4,
        pairsPerGroup || 4
      );
      return NextResponse.json({ groups }, { status: 201 });
    }

    // Создание одной группы
    if (!groupData.tournamentId || !groupData.category || !groupData.groupName) {
      return NextResponse.json(
        { error: 'tournamentId, category, and groupName are required' },
        { status: 400 }
      );
    }

    const group = await createTournamentGroup({
      tournamentId: groupData.tournamentId,
      category: groupData.category,
      groupName: groupData.groupName,
      groupNumber: groupData.groupNumber,
      maxPairs: groupData.maxPairs || 4,
      startTime: groupData.startTime,
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: error.message || 'Failed to create group' }, { status: 500 });
  }
}

// PUT - обновить группу
export async function PUT(request: NextRequest) {
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const group = await updateTournamentGroup(id, updates);
    return NextResponse.json({ group });
  } catch (error: any) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: error.message || 'Failed to update group' }, { status: 500 });
  }
}

// DELETE - удалить группу
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const success = await deleteTournamentGroup(parseInt(id));
    if (!success) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}

