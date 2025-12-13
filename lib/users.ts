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
  emailVerificationToken?: string;
  preferredLanguage?: string; // Locale for emails and UI
}

export interface UserUpdateData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  emailVerified?: boolean;
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

// Check if user email is verified
export async function isUserEmailVerified(email: string): Promise<boolean> {
  if (!useDatabase) {
    return false;
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.execute(
      'SELECT email_verified FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (rows.length === 0) return false;

    return rows[0].email_verified === 1 || rows[0].email_verified === true;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
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
    const userRole = user.role || 'participant'; // Устанавливаем дефолтную роль, если она null
    console.log(`[findUserById] User ${id} role: ${userRole} (raw: ${user.role})`);
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: userRole,
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
      'SELECT id, email, password_hash, first_name, last_name, role, created_at, email_verified FROM users WHERE email = ?',
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
      emailVerified: user.email_verified === 1 || user.email_verified === true,
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
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role, email_verification_token, email_verified, preferred_language) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.email, passwordHash, data.firstName, data.lastName, role, data.emailVerificationToken || null, false, data.preferredLanguage || null]
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

// Verify email
export async function verifyEmail(token: string): Promise<{ success: boolean; user?: User; error?: string }> {
  if (!useDatabase) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const pool = getDbPool();
    const [rows] = await pool.execute(
      'SELECT id, email, first_name, last_name, role, created_at, email_verified FROM users WHERE email_verification_token = ?',
      [token]
    ) as any[];

    if (rows.length === 0) {
      return { success: false, error: 'Invalid verification token' };
    }

    const user = rows[0];
    
    if (user.email_verified) {
      return { success: false, error: 'Email already verified' };
    }

    // Update user to verified
    await pool.execute(
      'UPDATE users SET email_verified = TRUE, email_verified_at = NOW(), email_verification_token = NULL, updated_at = NOW() WHERE id = ?',
      [user.id]
    );

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at.toISOString(),
      },
    };
  } catch (error: any) {
    console.error('Error verifying email:', error);
    return { success: false, error: 'Failed to verify email' };
  }
}

// Update user
export async function updateUser(id: string, data: UserUpdateData, sendRoleChangeEmail: boolean = true): Promise<User | null> {
  if (!useDatabase) {
    const user = users.get(id);
    if (!user) return null;
    
    const oldRole = user.role;
    
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
    
    // Get old user data to check role change
    const [oldUserRows] = await pool.execute(
      'SELECT role, first_name, email FROM users WHERE id = ?',
      [id]
    ) as any[];
    
    const oldUser = oldUserRows[0];
    const oldRole = oldUser?.role;
    
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
    if (data.role !== undefined && data.role !== null) {
      // Валидация роли - проверяем, что она соответствует ENUM
      const validRoles = ['superadmin', 'tournament_admin', 'manager', 'coach', 'staff', 'participant'];
      if (!validRoles.includes(data.role)) {
        console.error(`[updateUser] ERROR: Invalid role "${data.role}". Valid roles: ${validRoles.join(', ')}`);
        throw new Error(`Invalid role: ${data.role}`);
      }
      
      // Используем CAST для явного преобразования типа, чтобы избежать проблем с ENUM
      updates.push('role = CAST(? AS CHAR(20))');
      values.push(data.role);
      console.log(`[updateUser] Adding role update: "${data.role}" (type: ${typeof data.role}, length: ${data.role.length}) for user ${id} (old role: ${oldRole})`);
    }
    if (data.password) {
      const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }
    if (data.emailVerified !== undefined) {
      updates.push('email_verified = ?');
      values.push(data.emailVerified ? 1 : 0);
      if (data.emailVerified) {
        updates.push('email_verified_at = NOW()');
      } else {
        updates.push('email_verified_at = NULL');
      }
    }

    if (updates.length === 0) {
      return await findUserById(id);
    }

    values.push(id);
    const updateQuery = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
    console.log(`[updateUser] Executing update query:`, updateQuery);
    console.log(`[updateUser] Values:`, values);
    console.log(`[updateUser] Old role: ${oldRole}, New role: ${data.role}`);
    
    const [updateResult] = await pool.execute(updateQuery, values) as any[];
    console.log(`[updateUser] Update result:`, updateResult);
    console.log(`[updateUser] Rows affected:`, updateResult.affectedRows);
    
    // Проверяем, что UPDATE действительно выполнился
    if (updateResult.affectedRows === 0) {
      console.error(`[updateUser] WARNING: No rows affected for user ${id}! Update may have failed.`);
    }
    
    // Небольшая задержка перед чтением, чтобы дать время транзакции завершиться
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Проверяем роль напрямую из БД
    const [verifyRows] = await pool.execute(
      'SELECT role, CAST(role AS CHAR) as role_str, LENGTH(role) as role_len FROM users WHERE id = ?',
      [id]
    ) as any[];
    
    if (verifyRows.length > 0) {
      const dbRole = verifyRows[0].role;
      const dbRoleStr = verifyRows[0].role_str;
      const dbRoleLen = verifyRows[0].role_len;
      console.log(`[updateUser] Role in DB after update: "${dbRole}" (raw: "${dbRoleStr}", length: ${dbRoleLen}, type: ${typeof dbRole})`);
      
      if (data.role) {
        if (dbRole !== data.role) {
          console.error(`[updateUser] ERROR: Role mismatch! Expected: "${data.role}" (type: ${typeof data.role}, length: ${data.role.length}), Got: "${dbRole}" (type: ${typeof dbRole}, length: ${dbRoleLen})`);
          
          // Попытка исправить - выполнить UPDATE еще раз с явным указанием типа и проверкой ENUM
          console.log(`[updateUser] Attempting to fix role by updating again with explicit ENUM check...`);
          try {
            // Сначала проверяем, что роль действительно в списке допустимых значений ENUM
            const [enumCheck] = await pool.execute(
              `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() 
               AND TABLE_NAME = 'users' 
               AND COLUMN_NAME = 'role'`
            ) as any[];
            
            if (enumCheck.length > 0) {
              console.log(`[updateUser] Role column ENUM definition: ${enumCheck[0].COLUMN_TYPE}`);
            }
            
            // Выполняем UPDATE с явным указанием значения ENUM
            const [fixResult] = await pool.execute(
              `UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?`,
              [data.role, id]
            ) as any[];
            console.log(`[updateUser] Fix update result:`, fixResult);
            console.log(`[updateUser] Rows affected by fix:`, fixResult.affectedRows);
            
            // Ждем немного перед проверкой
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Проверяем снова с явным CAST
            const [recheckRows] = await pool.execute(
              'SELECT role, CAST(role AS CHAR(20)) as role_str FROM users WHERE id = ?',
              [id]
            ) as any[];
            if (recheckRows.length > 0) {
              console.log(`[updateUser] Role after fix: "${recheckRows[0].role}" (raw: "${recheckRows[0].role_str}")`);
              if (recheckRows[0].role !== data.role) {
                console.error(`[updateUser] CRITICAL: Role still doesn't match after fix! Expected: "${data.role}", Got: "${recheckRows[0].role}"`);
              }
            }
          } catch (fixError) {
            console.error(`[updateUser] Error fixing role:`, fixError);
            console.error(`[updateUser] Fix error stack:`, fixError instanceof Error ? fixError.stack : 'No stack trace');
          }
        } else {
          console.log(`[updateUser] ✅ Role matches!`);
        }
      }
    }
    
    const updatedUser = await findUserById(id);
    console.log(`[updateUser] User after update:`, updatedUser ? { id: updatedUser.id, role: updatedUser.role } : 'null');
    
    // Send role change notification if role changed and user exists
    if (sendRoleChangeEmail && data.role && oldRole && data.role !== oldRole && updatedUser && oldUser) {
      try {
        const { generateEmailTemplateHTML } = await import('./email-template-generator');
        const { sendEmail } = await import('./email');
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://padelo2.com';
        const userLocale = (updatedUser as any).preferredLanguage || 'en';
        const adminPanelUrl = `${siteUrl}/${userLocale}/admin/dashboard`;
        
        const emailHTML = await generateEmailTemplateHTML({
          templateId: 'role-change',
          data: {
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            newRole: data.role,
            oldRole: oldRole,
            adminPanelUrl,
            locale: userLocale,
          },
          locale: userLocale,
        });
        
        await sendEmail({
          to: updatedUser.email,
          subject: `Your Role Has Been Updated - PadelO₂`,
          html: emailHTML,
          from: 'admin@padelo2.com', // Только email, без угловых скобок и non-ASCII символов
          locale: userLocale,
        });
      } catch (emailError) {
        console.error('Error sending role change notification:', emailError);
        // Don't fail the update if email fails
      }
    }

    return updatedUser;
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
      'SELECT id, email, first_name, last_name, role, created_at, email_verified FROM users ORDER BY created_at DESC'
    ) as any[];

    return rows.map((user: any) => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at.toISOString(),
      emailVerified: user.email_verified === 1 || user.email_verified === true,
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
    
    // Проверяем, что сессия действительно создана
    const [verifyRows] = await pool.execute(
      'SELECT token, user_id, expires_at FROM sessions WHERE token = ?',
      [token]
    ) as any[];
    
    if (verifyRows.length === 0) {
      console.error(`❌ Session creation failed - session not found after INSERT for user ${userId}`);
      throw new Error('Session creation failed - verification failed');
    }
    
    console.log(`✅ Session created for user ${userId}, token: ${token.substring(0, 8)}..., expires at ${expiresAt.toISOString()}`);
    console.log(`✅ Session verification: found ${verifyRows.length} session(s) in database`);
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

    console.log(`[getSession] Query result: ${rows.length} row(s) found for token ${token.substring(0, 8)}...`);

    if (rows.length === 0) {
      // Проверяем, может быть сессия существует, но истекла
      const [expiredRows] = await pool.execute(
        'SELECT token, user_id, expires_at FROM sessions WHERE token = ?',
        [token]
      ) as any[];
      
      if (expiredRows.length > 0) {
        console.log(`[getSession] Session found but expired. Expires at: ${expiredRows[0].expires_at}, Now: ${new Date().toISOString()}`);
      } else {
        console.log(`[getSession] Session not found in database for token ${token.substring(0, 8)}...`);
      }
      
      // Удаляем истекшие сессии асинхронно (не блокируем ответ)
      pool.execute('DELETE FROM sessions WHERE token = ? AND expires_at <= NOW()', [token]).catch(() => {});
      return null;
    }

    // Проверяем, что пользователь существует
    if (!rows[0].user_id) {
      console.error(`[getSession] Session found but user_id is null or missing`);
      // Удаляем сессию с несуществующим пользователем асинхронно
      pool.execute('DELETE FROM sessions WHERE token = ?', [token]).catch(() => {});
      return null;
    }

    // Если роль отсутствует, пытаемся получить её напрямую из таблицы users
    let userRole = rows[0].role;
    if (!userRole) {
      console.warn(`[getSession] Role is null for user_id=${rows[0].user_id}, fetching from users table directly`);
      try {
        const [userRows] = await pool.execute(
          'SELECT role FROM users WHERE id = ?',
          [rows[0].user_id]
        ) as any[];
        
        if (userRows.length > 0) {
          userRole = userRows[0].role;
          console.log(`[getSession] Found role in users table: ${userRole}`);
          
          // Если роль все еще отсутствует, устанавливаем роль по умолчанию
          if (!userRole) {
            console.warn(`[getSession] Role still null, setting default role 'participant'`);
            await pool.execute(
              'UPDATE users SET role = ? WHERE id = ?',
              ['participant', rows[0].user_id]
            );
            userRole = 'participant';
          }
        } else {
          console.error(`[getSession] User not found in users table for user_id=${rows[0].user_id}`);
          // Удаляем сессию с несуществующим пользователем
          pool.execute('DELETE FROM sessions WHERE token = ?', [token]).catch(() => {});
          return null;
        }
      } catch (error: any) {
        console.error(`[getSession] Error fetching user role:`, error);
        // Устанавливаем роль по умолчанию
        userRole = 'participant';
      }
    }

    console.log(`[getSession] Session valid: userId=${rows[0].user_id}, role=${userRole}`);

    return {
      userId: rows[0].user_id,
      role: userRole as UserRole,
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

