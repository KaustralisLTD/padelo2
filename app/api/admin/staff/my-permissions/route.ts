import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getStaffTournamentAccess } from '@/lib/tournaments';

// GET - получить объединенные права доступа текущего пользователя
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Superadmin имеет все права
    if (session.role === 'superadmin') {
      return NextResponse.json({
        canManageUsers: true,
        canManageLogs: true,
        canManageTournaments: true,
        canSendEmails: true,
        canManageGroups: true,
        canManageMatches: true,
        canViewRegistrations: true,
      });
    }

    // Для других ролей получаем объединенные права из всех доступов
    const accessList = await getStaffTournamentAccess(undefined, session.userId);

    console.log(`[my-permissions] User ${session.userId} (${session.role}) has ${accessList.length} access records`);
    accessList.forEach((access, index) => {
      console.log(`[my-permissions] Access ${index + 1}:`, {
        tournamentId: access.tournamentId,
        canSendEmails: access.canSendEmails,
        canManageUsers: access.canManageUsers,
        canManageTournaments: access.canManageTournaments,
        canManageLogs: access.canManageLogs,
      });
    });

    // Объединяем права: если хотя бы в одном доступе есть право, то оно есть
    const permissions = {
      canManageUsers: accessList.some(a => a.canManageUsers === true),
      canManageLogs: accessList.some(a => a.canManageLogs === true),
      canManageTournaments: accessList.some(a => a.canManageTournaments === true),
      canSendEmails: accessList.some(a => a.canSendEmails === true),
      canManageGroups: accessList.some(a => a.canManageGroups === true),
      canManageMatches: accessList.some(a => a.canManageMatches === true),
      canViewRegistrations: accessList.some(a => a.canViewRegistrations === true),
    };

    console.log(`[my-permissions] Final permissions for user ${session.userId}:`, permissions);

    return NextResponse.json(permissions);
  } catch (error: any) {
    console.error('Error getting user permissions:', error);
    return NextResponse.json({ error: 'Failed to get permissions' }, { status: 500 });
  }
}

