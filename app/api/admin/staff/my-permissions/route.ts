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

    // Объединяем права: если хотя бы в одном доступе есть право, то оно есть
    const permissions = {
      canManageUsers: accessList.some(a => a.canManageUsers),
      canManageLogs: accessList.some(a => a.canManageLogs),
      canManageTournaments: accessList.some(a => a.canManageTournaments),
      canSendEmails: accessList.some(a => a.canSendEmails),
      canManageGroups: accessList.some(a => a.canManageGroups),
      canManageMatches: accessList.some(a => a.canManageMatches),
      canViewRegistrations: accessList.some(a => a.canViewRegistrations),
    };

    return NextResponse.json(permissions);
  } catch (error: any) {
    console.error('Error getting user permissions:', error);
    return NextResponse.json({ error: 'Failed to get permissions' }, { status: 500 });
  }
}

