// Database connection for production
// This will be used when DATABASE_URL is set

import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool {
  if (!pool) {
    const config: mysql.PoolOptions = {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      // Для удаленных подключений
      connectTimeout: 10000, // 10 секунд
          // SSL для безопасного подключения (если требуется)
          ssl: process.env.DATABASE_SSL === 'true' ? {
            rejectUnauthorized: false
          } : undefined,
    };

    if (!config.user || !config.password || !config.database) {
      console.log('⚠️  Database not configured. Using in-memory storage.');
      throw new Error('Database credentials not configured');
    }

    console.log(`🔌 Connecting to database: ${config.host}:${config.port}/${config.database}`);
    pool = mysql.createPool(config);
  }

  return pool;
}

export async function initDatabase() {
  // Check if database is configured
  if (!process.env.DATABASE_HOST || !process.env.DATABASE_USER || !process.env.DATABASE_PASSWORD || !process.env.DATABASE_NAME) {
    console.log('⚠️  Database not configured. Skipping database initialization.');
    return;
  }
  
  try {
    const pool = getDbPool();
  
  // Create tournament_registrations table if it doesn't exist
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tournament_registrations (
      id INT(11) NOT NULL AUTO_INCREMENT,
      token VARCHAR(64) NOT NULL UNIQUE,
      tournament_id INT(11) NOT NULL,
      tournament_name VARCHAR(255) NOT NULL,
      locale VARCHAR(10) NOT NULL DEFAULT 'en',
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      telegram VARCHAR(100) DEFAULT NULL,
      phone VARCHAR(50) NOT NULL,
      categories JSON NOT NULL,
      tshirt_size VARCHAR(10) NOT NULL,
      message TEXT DEFAULT NULL,
      partner_name VARCHAR(100) DEFAULT NULL,
      partner_email VARCHAR(255) DEFAULT NULL,
      partner_phone VARCHAR(50) DEFAULT NULL,
      partner_tshirt_size VARCHAR(10) DEFAULT NULL,
      partner_photo_name VARCHAR(255) DEFAULT NULL,
      partner_photo_data LONGTEXT DEFAULT NULL,
      confirmed BOOLEAN DEFAULT FALSE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      confirmed_at DATETIME DEFAULT NULL,
      PRIMARY KEY (id),
      INDEX idx_token (token),
      INDEX idx_email (email),
      INDEX idx_tournament (tournament_id),
      INDEX idx_confirmed (confirmed)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Create users table if it doesn't exist
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role ENUM('superadmin', 'staff', 'participant') NOT NULL DEFAULT 'participant',
      phone VARCHAR(50) DEFAULT NULL,
      telegram VARCHAR(100) DEFAULT NULL,
      date_of_birth DATE DEFAULT NULL,
      tshirt_size VARCHAR(10) DEFAULT NULL,
      photo_name VARCHAR(255) DEFAULT NULL,
      photo_data LONGTEXT DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_email (email),
      INDEX idx_role (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Add new columns if they don't exist (for existing tables)
  try {
    await pool.execute('ALTER TABLE users ADD COLUMN phone VARCHAR(50) DEFAULT NULL');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }
  try {
    await pool.execute('ALTER TABLE users ADD COLUMN telegram VARCHAR(100) DEFAULT NULL');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }
  try {
    await pool.execute('ALTER TABLE users ADD COLUMN date_of_birth DATE DEFAULT NULL');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }
  try {
    await pool.execute('ALTER TABLE users ADD COLUMN tshirt_size VARCHAR(10) DEFAULT NULL');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }
  try {
    await pool.execute('ALTER TABLE users ADD COLUMN photo_name VARCHAR(255) DEFAULT NULL');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }
  try {
    await pool.execute('ALTER TABLE users ADD COLUMN photo_data LONGTEXT DEFAULT NULL');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }

  // Create sessions table for storing user sessions
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      token VARCHAR(64) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (token),
      INDEX idx_user_id (user_id),
      INDEX idx_expires_at (expires_at),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Create tournaments table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INT(11) NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT NULL,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      registration_deadline DATETIME DEFAULT NULL,
      location VARCHAR(255) DEFAULT NULL,
      max_participants INT(11) DEFAULT NULL,
      status ENUM('draft', 'open', 'closed', 'in_progress', 'completed') NOT NULL DEFAULT 'draft',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_status (status),
      INDEX idx_start_date (start_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Create tournament_groups table (группы в турнирах)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tournament_groups (
      id INT(11) NOT NULL AUTO_INCREMENT,
      tournament_id INT(11) NOT NULL,
      category VARCHAR(50) NOT NULL,
      group_name VARCHAR(100) NOT NULL,
      group_number INT(11) NOT NULL,
      max_pairs INT(11) NOT NULL DEFAULT 4,
      start_time DATETIME DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_tournament (tournament_id),
      INDEX idx_category (category),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      UNIQUE KEY unique_tournament_category_group (tournament_id, category, group_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Create tournament_group_pairs table (пары в группах)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tournament_group_pairs (
      id INT(11) NOT NULL AUTO_INCREMENT,
      group_id INT(11) NOT NULL,
      pair_number INT(11) NOT NULL,
      player1_registration_id INT(11) DEFAULT NULL,
      player2_registration_id INT(11) DEFAULT NULL,
      partner1_registration_id INT(11) DEFAULT NULL,
      partner2_registration_id INT(11) DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_group (group_id),
      INDEX idx_registration (player1_registration_id),
      FOREIGN KEY (group_id) REFERENCES tournament_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (player1_registration_id) REFERENCES tournament_registrations(id) ON DELETE SET NULL,
      FOREIGN KEY (player2_registration_id) REFERENCES tournament_registrations(id) ON DELETE SET NULL,
      UNIQUE KEY unique_group_pair (group_id, pair_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Create staff_tournament_access table (доступ сотрудников к турнирам)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS staff_tournament_access (
      id INT(11) NOT NULL AUTO_INCREMENT,
      user_id VARCHAR(36) NOT NULL,
      tournament_id INT(11) NOT NULL,
      can_manage_groups BOOLEAN DEFAULT TRUE,
      can_manage_matches BOOLEAN DEFAULT TRUE,
      can_view_registrations BOOLEAN DEFAULT TRUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_user (user_id),
      INDEX idx_tournament (tournament_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_tournament (user_id, tournament_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  } catch (error: any) {
    if (error.message.includes('Database credentials not configured')) {
      // Expected error when DB is not configured
      return;
    }
    throw error;
  }
}

