// User management utilities
// Handles user CRUD operations with password hashing

import { getDbPool } from './db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, UserRole } from './auth';

const SALT_ROUNDS = 10;

export interface UserCreateData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UserUpdateData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

// Check if database is configured
const useDatabase = !!(
  process.env.DATABASE_HOST &&
  process.env.DATABASE_USER &&
  process.env.DATABASE_PASSWORD &&
  process.env.DATABASE_NAME
);

// In-memory storage for development (fallback)
const users = new Map<string, any>();
const sessions = new Map<string, any>();

// Initialize with a default superadmin if no users exist
export async function initializeDefaultAdmin() {
  if (!useDatabase) {
    // In-memory fallback - always ensure admin exists
    const existingAdmin = users.get('admin@padelo2.com');
    if (!existingAdmin) {
      const superadminId = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
      const superadmin = {
        id: superadminId,
        email: 'admin@padelo2.com',
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin' as const,
        createdAt: new Date().toISOString(),
      };
      users.set(superadmin.email, superadmin);
      console.log('✅ In-memory admin created: admin@padelo2.com / admin123');
    }
    return;
  }

  try {
    const pool = getDbPool();
    
    // Check if admin already exists
    // Не используем SELECT * чтобы избежать загрузки photo_data (LONGTEXT) - это замедляет запросы
    const [existing] = await pool.execute(
      'SELECT id, email, first_name, last_name, role FROM users WHERE email = ?',
      ['admin@padelo2.com']
    ) as any[];
    
    if (existing.length > 0) {
      console.log('✅ Admin user already exists in database');
      // Обновляем пароль на всякий случай, если он был изменен
      const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
      await pool.execute(
        `UPDATE users 
         SET password_hash = ?, role = 'superadmin', updated_at = NOW()
         WHERE email = 'admin@padelo2.com'`,
        [passwordHash]
      );
      return;
    }
    
    // Всегда создаем админа, если его нет (независимо от количества других пользователей)
    const adminId = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
    
    try {
      await pool.execute(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [adminId, 'admin@padelo2.com', passwordHash, 'Super', 'Admin', 'superadmin']
      );
      
      console.log('✅ Default superadmin created in database: admin@padelo2.com / admin123');
    } catch (error: any) {
      // Если админ уже существует (race condition), просто логируем
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('✅ Admin user already exists (created by another process)');
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error('❌ Error initializing default admin:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  Database connection failed. Using in-memory storage.');
    }
  }
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  if (!useDatabase) {
    const user = users.get(email);
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.execute(
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (rows.length === 0) return null;

    const user = rows[0];
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at.toISOString(),
    };
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

// Find user by ID
export async function findUserById(id: string): Promise<User | null> {
  if (!useDatabase) {
    for (const user of users.values()) {
      if (user.id === id) {
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt,
        };
      }
    }
    return null;
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.execute(
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = ?',
      [id]
    ) as any[];

    if (rows.length === 0) return null;

    const user = rows[0];
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at.toISOString(),
    };
  } catch (error) {
    console.error('Error finding user by id:', error);
    return null;
  }
}

// Verify password
export async function verifyPassword(email: string, password: string): Promise<User | null> {
  if (!useDatabase) {
    const user = users.get(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.execute(
      'SELECT id, email, password_hash, first_name, last_name, role, created_at FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (rows.length === 0) {
      return null;
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at.toISOString(),
    };
  } catch (error: any) {
    console.error('[Auth] Error verifying password:', error.message || error);
    console.error('[Auth] Error stack:', error.stack);
    return null;
  }
}

// Create user
export async function createUser(data: UserCreateData): Promise<User> {
  const userId = crypto.randomBytes(16).toString('hex');
  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const role = data.role || 'participant';

  if (!useDatabase) {
    const user = {
      id: userId,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role,
      createdAt: new Date().toISOString(),
    };
    users.set(data.email, user);
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  try {
    const pool = getDbPool();
    await pool.execute(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, data.email, passwordHash, data.firstName, data.lastName, role]
    );

    return {
      id: userId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role,
      createdAt: new Date().toISOString(),
    };
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('User with this email already exists');
    }
    console.error('Error creating user:', error);
    throw error;
  }
}

// Update user
export async function updateUser(id: string, data: UserUpdateData): Promise<User | null> {
  if (!useDatabase) {
    const user = users.get(id);
    if (!user) return null;
    
    if (data.email) user.email = data.email;
    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.role) user.role = data.role;
    if (data.password) {
      user.passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    }
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  try {
    const pool = getDbPool();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.email) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.firstName) {
      updates.push('first_name = ?');
      values.push(data.firstName);
    }
    if (data.lastName) {
      updates.push('last_name = ?');
      values.push(data.lastName);
    }
    if (data.role) {
      updates.push('role = ?');
      values.push(data.role);
    }
    if (data.password) {
      const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return await findUserById(id);
    }

    values.push(id);
    await pool.execute(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    return await findUserById(id);
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('User with this email already exists');
    }
    console.error('Error updating user:', error);
    throw error;
  }
}

// Delete user
export async function deleteUser(id: string): Promise<boolean> {
  // Защита от удаления админа
  if (!useDatabase) {
    for (const [email, user] of users.entries()) {
      if (user.id === id) {
        // Не позволяем удалить админа
        if (email === 'admin@padelo2.com' || user.role === 'superadmin') {
          throw new Error('Cannot delete superadmin user');
        }
        users.delete(email);
        return true;
      }
    }
    return false;
  }

  try {
    const pool = getDbPool();
    
    // Проверяем, не пытаемся ли удалить админа
    const [checkUser] = await pool.execute(
      'SELECT email, role FROM users WHERE id = ?',
      [id]
    ) as any[];
    
    if (checkUser.length > 0) {
      const user = checkUser[0];
      if (user.email === 'admin@padelo2.com' || user.role === 'superadmin') {
        throw new Error('Cannot delete superadmin user');
      }
    }
    
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]) as any[];
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

// Get all users
export async function getAllUsers(): Promise<User[]> {
  if (!useDatabase) {
    return Array.from(users.values()).map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    }));
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.execute(
      'SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY created_at DESC'
    ) as any[];

    return rows.map((user: any) => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at.toISOString(),
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

// Session management
export async function createSession(userId: string, expiresInDays: number = 7): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  if (!useDatabase) {
    // Очищаем истекшие сессии в памяти
    for (const [t, session] of sessions.entries()) {
      if (new Date(session.expiresAt) < new Date()) {
        sessions.delete(t);
      }
    }
    
    sessions.set(token, {
      userId,
      expiresAt: expiresAt.toISOString(),
    });
    return token;
  }

  try {
    const pool = getDbPool();
    
    // Удаляем старые сессии этого пользователя перед созданием новой (опционально)
    // Можно оставить несколько активных сессий, или удалить все старые
    // Сейчас оставляем возможность иметь несколько сессий
    
    // Очищаем истекшие сессии перед созданием новой (оптимизация: делаем это реже)
    // Удаляем только старые сессии этого пользователя (опционально - можно оставить несколько активных)
    // await pool.execute('DELETE FROM sessions WHERE expires_at <= NOW()');
    
    // Создаем новую сессию
    await pool.execute(
      'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
      [token, userId, expiresAt]
    );
    
    console.log(`✅ Session created for user ${userId}, token: ${token.substring(0, 8)}..., expires at ${expiresAt.toISOString()}`);
    return token;
  } catch (error: any) {
    // Если БД недоступна, используем in-memory режим
    if (error.message?.includes('max_user_connections') || 
        error.message?.includes('exceeded') ||
        error.code === 'ER_TOO_MANY_USER_CONNECTIONS' ||
        error.code === 'ECONNREFUSED') {
      console.warn('[Auth] Database unavailable, using in-memory session storage');
      // Очищаем истекшие сессии в памяти
      for (const [t, session] of sessions.entries()) {
        if (new Date(session.expiresAt) < new Date()) {
          sessions.delete(t);
        }
      }
      
      sessions.set(token, {
        userId,
        expiresAt: expiresAt.toISOString(),
      });
      console.log(`✅ In-memory session created for user ${userId}`);
      return token;
    }
    console.error('Error creating session:', error);
    throw error;
  }
}

export async function getSession(token: string): Promise<{ userId: string; role: UserRole } | null> {
  if (!useDatabase) {
    const session = sessions.get(token);
    if (!session) return null;
    
    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      sessions.delete(token);
      return null;
    }
    
    // Get user to get role
    const user = await findUserById(session.userId);
    if (!user) {
      sessions.delete(token);
      return null;
    }
    
    return {
      userId: user.id,
      role: user.role,
    };
  }

  try {
    const pool = getDbPool();
    
    // Оптимизированный запрос: проверяем сессию и пользователя одним запросом
    // Используем LEFT JOIN чтобы не потерять сессию, если пользователь существует
    const [rows] = await pool.execute(
      `SELECT s.user_id, u.role, s.expires_at
       FROM sessions s 
       LEFT JOIN users u ON s.user_id = u.id 
       WHERE s.token = ? AND s.expires_at > NOW()`,
      [token]
    ) as any[];

    if (rows.length === 0) {
      // Удаляем истекшие сессии асинхронно (не блокируем ответ)
      pool.execute('DELETE FROM sessions WHERE token = ? AND expires_at <= NOW()', [token]).catch(() => {});
      return null;
    }

    // Проверяем, что пользователь существует
    if (!rows[0].user_id || !rows[0].role) {
      // Удаляем сессию с несуществующим пользователем асинхронно
      pool.execute('DELETE FROM sessions WHERE token = ?', [token]).catch(() => {});
      return null;
    }

    return {
      userId: rows[0].user_id,
      role: rows[0].role,
    };
  } catch (error: any) {
    console.error('Error getting session:', error);
    // Если БД недоступна, проверяем in-memory сессии
    if (error.message?.includes('max_user_connections') || 
        error.message?.includes('exceeded') ||
        error.code === 'ER_TOO_MANY_USER_CONNECTIONS' ||
        error.code === 'ECONNREFUSED') {
      console.warn('[Auth] Database unavailable, checking in-memory sessions');
      const memSession = sessions.get(token);
      if (memSession && new Date(memSession.expiresAt) > new Date()) {
        // Для экстренного админа используем роль напрямую
        if (memSession.userId.startsWith('emergency-admin-')) {
          return {
            userId: memSession.userId,
            role: 'superadmin' as const,
          };
        }
        // Для обычных пользователей пытаемся найти в памяти
        for (const [email, user] of users.entries()) {
          if (user.id === memSession.userId) {
            return {
              userId: user.id,
              role: user.role,
            };
          }
        }
      }
    }
    return null;
  }
}

export async function deleteSession(token: string): Promise<boolean> {
  if (!useDatabase) {
    return sessions.delete(token);
  }

  try {
    const pool = getDbPool();
    const [result] = await pool.execute('DELETE FROM sessions WHERE token = ?', [token]) as any[];
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

