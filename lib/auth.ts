// Authentication and authorization utilities

export type UserRole = 'superadmin' | 'tournament_admin' | 'manager' | 'coach' | 'staff' | 'participant';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
}

// Role permissions
export const rolePermissions: Record<UserRole, string[]> = {
  superadmin: [
    'manage_users',
    'manage_tournaments',
    'manage_registrations',
    'view_all_data',
    'edit_players',
    'manage_staff',
  ],
  tournament_admin: [
    'manage_tournaments',
    'manage_registrations',
    'edit_players',
    'view_participants',
  ],
  manager: [
    'manage_tournaments',
    'manage_registrations',
    'edit_players',
    'view_participants',
  ],
  coach: [
    'view_participants',
    'edit_players',
  ],
  staff: [
    'manage_tournaments',
    'manage_registrations',
    'edit_players',
    'view_participants',
  ],
  participant: [
    'view_own_schedule',
    'view_own_results',
    'view_own_registration',
    'upload_photo',
  ],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  // Superadmin can access everything
  if (role === 'superadmin') return true;

  // Staff routes
  if (route.startsWith('/admin/') || route.startsWith('/staff/')) {
    return role === 'staff';
  }

  // Participant routes
  if (route.startsWith('/dashboard') || route.startsWith('/participant/')) {
    return true; // All authenticated users can access their dashboard
  }

  return false;
}


