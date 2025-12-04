/**
 * Club Access Utilities
 * Утилиты для проверки доступа пользователей к клубам
 */

import { getDbPool } from './db';
import { getSession } from './users';

export interface ClubAccess {
  userId: string;
  clubId: number;
  role: 'admin' | 'manager' | 'staff' | 'coach';
}

/**
 * Проверить, имеет ли пользователь доступ к клубу
 */
export async function hasClubAccess(
  userId: string,
  clubId: number,
  requiredRole?: 'admin' | 'manager' | 'staff' | 'coach'
): Promise<boolean> {
  try {
    const pool = getDbPool();
    
    // Суперадмин имеет доступ ко всем клубам
    const [users] = await pool.execute(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
    if (users.length > 0 && users[0].role === 'superadmin') {
      return true;
    }
    
    // Проверяем доступ в таблице user_club_access
    let query = 'SELECT role FROM user_club_access WHERE user_id = ? AND club_id = ?';
    const params: any[] = [userId, clubId];
    
    if (requiredRole) {
      // Если требуется конкретная роль, проверяем её
      // Админ имеет доступ ко всем операциям
      if (requiredRole === 'admin') {
        query += ' AND role = ?';
        params.push('admin');
      } else {
        // Для других ролей проверяем, что роль достаточна
        query += ' AND role IN (?, ?)';
        params.push('admin', requiredRole);
      }
    }
    
    const [accesses] = await pool.execute(query, params) as any[];
    
    return accesses.length > 0;
  } catch (error) {
    console.error('Error checking club access:', error);
    return false;
  }
}

/**
 * Получить список клубов, к которым у пользователя есть доступ
 */
export async function getUserClubs(userId: string): Promise<number[]> {
  try {
    const pool = getDbPool();
    
    // Суперадмин имеет доступ ко всем клубам
    const [users] = await pool.execute(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
    if (users.length > 0 && users[0].role === 'superadmin') {
      // Возвращаем все клубы
      const [allClubs] = await pool.execute('SELECT id FROM clubs') as any[];
      return allClubs.map((club: any) => club.id);
    }
    
    // Получаем клубы из user_club_access
    const [accesses] = await pool.execute(
      'SELECT DISTINCT club_id FROM user_club_access WHERE user_id = ?',
      [userId]
    ) as any[];
    
    return accesses.map((access: any) => access.club_id);
  } catch (error) {
    console.error('Error getting user clubs:', error);
    return [];
  }
}

/**
 * Проверить доступ из сессии (для использования в API routes)
 */
export async function checkClubAccessFromSession(
  token: string | null,
  clubId: number,
  requiredRole?: 'admin' | 'manager' | 'staff' | 'coach'
): Promise<{ authorized: boolean; userId?: string; role?: string }> {
  if (!token) {
    return { authorized: false };
  }
  
  try {
    const session = await getSession(token);
    if (!session) {
      return { authorized: false };
    }
    
    const hasAccess = await hasClubAccess(session.userId, clubId, requiredRole);
    
    if (!hasAccess) {
      return { authorized: false };
    }
    
    return { authorized: true, userId: session.userId, role: session.role };
  } catch (error) {
    console.error('Error checking club access from session:', error);
    return { authorized: false };
  }
}

/**
 * Получить роль пользователя в клубе
 */
export async function getUserClubRole(
  userId: string,
  clubId: number
): Promise<'admin' | 'manager' | 'staff' | 'coach' | null> {
  try {
    const pool = getDbPool();
    
    // Суперадмин считается админом всех клубов
    const [users] = await pool.execute(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
    if (users.length > 0 && users[0].role === 'superadmin') {
      return 'admin';
    }
    
    // Получаем роль из user_club_access
    const [accesses] = await pool.execute(
      'SELECT role FROM user_club_access WHERE user_id = ? AND club_id = ? ORDER BY FIELD(role, "admin", "manager", "staff", "coach") LIMIT 1',
      [userId, clubId]
    ) as any[];
    
    if (accesses.length > 0) {
      return accesses[0].role;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user club role:', error);
    return null;
  }
}

