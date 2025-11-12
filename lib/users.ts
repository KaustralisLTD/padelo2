// User management utilities
// Handles user CRUD operations with password hashing

import { getDbPool } from './db';
import bcrypt from 'bcrypt';
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
    const [existing] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@padelo2.com']
    ) as any[];
    
    if (existing.length > 0) {
      console.log('✅ Admin user already exists in database');
      return;
    }
    
    // Check total user count
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM users') as any[];
    
    if (rows[0].count === 0) {
      // Create default superadmin
      const adminId = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
      
      await pool.execute(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [adminId, 'admin@padelo2.com', passwordHash, 'Super', 'Admin', 'superadmin']
      );
      
      console.log('✅ Default superadmin created in database: admin@padelo2.com / admin123');
    } else {
      console.log('⚠️  Users exist in database, but admin@padelo2.com not found. Create admin manually via admin panel.');
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

    if (rows.length === 0) return null;

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at.toISOString(),
    };
  } catch (error) {
    console.error('Error verifying password:', error);
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
  if (!useDatabase) {
    for (const [email, user] of users.entries()) {
      if (user.id === id) {
        users.delete(email);
        return true;
      }
    }
    return false;
  }

  try {
    const pool = getDbPool();
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
    sessions.set(token, {
      userId,
      expiresAt: expiresAt.toISOString(),
    });
    return token;
  }

  try {
    const pool = getDbPool();
    await pool.execute(
      'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
      [token, userId, expiresAt]
    );
    return token;
  } catch (error) {
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
    const [rows] = await pool.execute(
      `SELECT s.user_id, u.role 
       FROM sessions s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.token = ? AND s.expires_at > NOW()`,
      [token]
    ) as any[];

    if (rows.length === 0) return null;

    return {
      userId: rows[0].user_id,
      role: rows[0].role,
    };
  } catch (error) {
    console.error('Error getting session:', error);
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

