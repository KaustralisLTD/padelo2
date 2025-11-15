import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import {
  getStaffTournamentAccess,
  createStaffTournamentAccess,
  updateStaffTournamentAccess,
  deleteStaffTournamentAccess,
  type StaffTournamentAccess,
} from '@/lib/tournaments';
import { getAllUsers } from '@/lib/users';
import { getAllTournaments } from '@/lib/tournaments';

// GET - получить доступы сотрудников
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (session?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const userId = searchParams.get('userId');

    const access = await getStaffTournamentAccess(
      tournamentId ? parseInt(tournamentId) : undefined,
      userId || undefined
    );

    // Если нужны полные данные, получаем пользователей и турниры
    if (searchParams.get('includeDetails') === 'true') {
      const users = await getAllUsers();
      const tournaments = await getAllTournaments();

      const accessWithDetails = access.map((a) => {
        const user = users.find((u) => u.id === a.userId);
        const tournament = tournaments.find((t) => t.id === a.tournamentId);
        return {
          ...a,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          userEmail: user?.email || 'Unknown',
          tournamentName: tournament?.name || 'Unknown',
        };
      });

      return NextResponse.json({ access: accessWithDetails, users, tournaments });
    }

    return NextResponse.json({ access });
  } catch (error: any) {
    console.error('Error getting staff access:', error);
    return NextResponse.json({ error: 'Failed to get staff access' }, { status: 500 });
  }
}

// POST - создать доступ сотрудника к турниру
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (session?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      tournamentId,
      canManageGroups = true,
      canManageMatches = true,
      canViewRegistrations = true,
      canManageUsers = false,
      canManageLogs = false,
      canManageTournaments = false,
    } = body;

    if (!userId || !tournamentId) {
      return NextResponse.json(
        { error: 'userId and tournamentId are required' },
        { status: 400 }
      );
    }

    const access = await createStaffTournamentAccess({
      userId,
      tournamentId,
      canManageGroups,
      canManageMatches,
      canViewRegistrations,
      canManageUsers,
      canManageLogs,
      canManageTournaments,
    });

    return NextResponse.json({ access }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating staff access:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create staff access' },
      { status: 500 }
    );
  }
}

// PUT - обновить доступ сотрудника
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (session?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, tournamentId, ...updates } = body;

    if (!userId || !tournamentId) {
      return NextResponse.json(
        { error: 'userId and tournamentId are required' },
        { status: 400 }
      );
    }

    const access = await updateStaffTournamentAccess(userId, tournamentId, updates);
    return NextResponse.json({ access });
  } catch (error: any) {
    console.error('Error updating staff access:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update staff access' },
      { status: 500 }
    );
  }
}

// DELETE - удалить доступ сотрудника
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (session?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const tournamentId = searchParams.get('tournamentId');

    if (!userId || !tournamentId) {
      return NextResponse.json(
        { error: 'userId and tournamentId are required' },
        { status: 400 }
      );
    }

    const success = await deleteStaffTournamentAccess(userId, parseInt(tournamentId));
    if (!success) {
      return NextResponse.json({ error: 'Access not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting staff access:', error);
    return NextResponse.json({ error: 'Failed to delete staff access' }, { status: 500 });
  }
}

