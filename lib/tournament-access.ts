import { getSession } from '@/lib/users';
import { getStaffTournamentAccess } from '@/lib/tournaments';
import { UserRole } from '@/lib/auth';

/**
 * Проверяет, имеет ли пользователь доступ к конкретному турниру
 * @param userId - ID пользователя
 * @param tournamentId - ID турнира
 * @param requiredPermission - Требуемое право (canManageTournaments, canViewRegistrations, etc.)
 * @returns true если пользователь имеет доступ, false в противном случае
 */
export async function hasTournamentAccess(
  userId: string,
  tournamentId: number,
  requiredPermission?: 'canManageTournaments' | 'canViewRegistrations' | 'canManageGroups' | 'canManageMatches'
): Promise<boolean> {
  try {
    const accessList = await getStaffTournamentAccess(tournamentId, userId);
    
    if (accessList.length === 0) {
      return false;
    }

    // Если указано конкретное право, проверяем его
    if (requiredPermission) {
      return accessList.some(access => access[requiredPermission] === true);
    }

    // Если право не указано, проверяем наличие любого доступа
    return accessList.length > 0;
  } catch (error) {
    console.error('Error checking tournament access:', error);
    return false;
  }
}

/**
 * Проверяет доступ к турниру из сессии (для использования в API routes)
 * @param token - Токен авторизации
 * @param tournamentId - ID турнира
 * @param requiredPermission - Требуемое право
 * @returns Объект с информацией об авторизации
 */
export async function checkTournamentAccess(
  token: string | null,
  tournamentId: number,
  requiredPermission?: 'canManageTournaments' | 'canViewRegistrations' | 'canManageGroups' | 'canManageMatches'
): Promise<{ authorized: boolean; userId?: string; role?: UserRole }> {
  if (!token) {
    return { authorized: false };
  }

  const session = await getSession(token);
  if (!session) {
    return { authorized: false };
  }

  // Superadmin имеет доступ ко всем турнирам
  if (session.role === 'superadmin') {
    return { authorized: true, userId: session.userId, role: session.role };
  }

  // Для других ролей проверяем доступ к конкретному турниру
  const hasAccess = await hasTournamentAccess(session.userId, tournamentId, requiredPermission);
  
  if (hasAccess) {
    return { authorized: true, userId: session.userId, role: session.role };
  }

  return { authorized: false };
}

