// Database connection for production
// This will be used when DATABASE_URL is set

import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

// Мониторинг пула соединений
let monitoringInterval: NodeJS.Timeout | null = null;
let connectionStats = {
  totalAcquired: 0,
  totalReleased: 0,
  currentActive: 0,
  errors: 0,
};

function setupPoolMonitoring(pool: mysql.Pool, connectionLimit: number) {
  // Логируем статистику пула каждые 30 секунд (только в development)
  if (process.env.NODE_ENV === 'development') {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }
    
    monitoringInterval = setInterval(() => {
      const poolState = pool as any;
      const activeConnections = poolState._allConnections?.length || 0;
      const freeConnections = poolState._freeConnections?.length || 0;
      const queuedRequests = poolState._connectionQueue?.length || 0;
      
      // Логируем только если есть активность или проблемы
      if (activeConnections > 0 || queuedRequests > 0 || connectionStats.errors > 0) {
        console.log(`📊 DB Pool Stats: Active=${activeConnections}/${connectionLimit}, Free=${freeConnections}, Queued=${queuedRequests}, Acquired=${connectionStats.totalAcquired}, Released=${connectionStats.totalReleased}, Errors=${connectionStats.errors}`);
        
        // Предупреждение при превышении 80% лимита
        if (activeConnections >= connectionLimit * 0.8) {
          console.warn(`⚠️  WARNING: Pool connections at ${Math.round((activeConnections / connectionLimit) * 100)}% capacity!`);
        }
      }
    }, 30000);
  }

  // Обработка ошибок соединений
  pool.on('connection', (connection) => {
    console.log(`✅ New DB connection established (ID: ${connection.threadId})`);
    
    // Устанавливаем таймаут на запросы для этого соединения
    connection.on('error', (err: any) => {
      connectionStats.errors++;
      console.error('❌ DB Connection error:', err);
      
      // При критических ошибках закрываем соединение принудительно
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || 
          err.code === 'ECONNRESET' || 
          err.code === 'ER_TOO_MANY_USER_CONNECTIONS' ||
          err.fatal) {
        console.log('🔄 Connection lost or fatal error, will be recreated automatically');
        // Соединение будет автоматически удалено из пула при ошибке
      }
    });
    
    // Устанавливаем таймаут на запросы (30 секунд) - если поддерживается
    if (connection.config) {
      (connection.config as any).queryTimeout = 30000;
    }
  });

  pool.on('acquire', (connection) => {
    connectionStats.totalAcquired++;
    connectionStats.currentActive++;
    console.log(`🔓 Connection acquired (ID: ${connection.threadId}) - Total: ${connectionStats.totalAcquired}`);
  });

  pool.on('release', (connection) => {
    connectionStats.totalReleased++;
    connectionStats.currentActive = Math.max(0, connectionStats.currentActive - 1);
    console.log(`🔒 Connection released (ID: ${connection.threadId}) - Total: ${connectionStats.totalReleased}`);
  });
}

let currentConnectionLimit = 3;

// Функция для получения статистики пула
export function getPoolStats() {
  if (!pool) return null;
  
  const poolState = pool as any;
  return {
    active: poolState._allConnections?.length || 0,
    free: poolState._freeConnections?.length || 0,
    queued: poolState._connectionQueue?.length || 0,
    limit: currentConnectionLimit,
    stats: { ...connectionStats },
  };
}

// Функция для закрытия всех соединений (для экстренных случаев)
export async function closeAllConnections(): Promise<void> {
  if (pool) {
    console.log('🛑 Closing all database connections...');
    await pool.end();
    pool = null;
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
    connectionStats = {
      totalAcquired: 0,
      totalReleased: 0,
      currentActive: 0,
      errors: 0,
    };
    console.log('✅ All connections closed');
  }
}

// Обертка для безопасного выполнения запросов с таймаутом
export async function executeQuery<T = any>(
  query: string,
  params?: any[]
): Promise<[T[], any]> {
  const pool = getDbPool();
  
  // Создаем Promise с таймаутом
  const queryPromise = pool.execute(query, params) as Promise<[T[], any]>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout after 30 seconds')), 30000);
  });
  
  try {
    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (error: any) {
    // Логируем ошибки для диагностики
    if (error.message?.includes('timeout')) {
      console.error(`⏱️  Query timeout: ${query.substring(0, 100)}...`);
    } else if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      console.error('❌ Too many connections - limit exceeded');
    }
    throw error;
  }
}

export function getDbPool(): mysql.Pool {
  if (!pool) {
    // Для shared hosting с лимитом 50 соединений используем консервативные настройки
    // Учитываем, что могут быть несколько процессов (dev server, build, scripts)
    currentConnectionLimit = 2; // Максимум 2 соединения на процесс (для shared hosting)
    const config: mysql.PoolOptions = {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      waitForConnections: true,
      connectionLimit: currentConnectionLimit,
      queueLimit: 10, // Ограничиваем очередь запросов (вместо бесконечной)
      maxIdle: 1, // Максимум 1 неактивное соединение (автоматически закрывает лишние)
      charset: 'utf8mb4',
      // Таймауты для предотвращения зависших соединений
      connectTimeout: 10000, // 10 секунд на подключение
      idleTimeout: 300000, // 5 минут - автоматическое закрытие неактивных соединений (вместо 30 минут)
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
    setupPoolMonitoring(pool, currentConnectionLimit);
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

  // Add payment_status and payment_date columns to tournament_registrations
  try {
    await pool.execute(`
      ALTER TABLE tournament_registrations
      ADD COLUMN payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending'
    `);
  } catch (e: any) {
    if (!e.message?.toLowerCase().includes('duplicate column name')) {
      throw e;
    }
  }

  try {
    await pool.execute(`
      ALTER TABLE tournament_registrations
      ADD COLUMN payment_date DATETIME DEFAULT NULL
    `);
  } catch (e: any) {
    if (!e.message?.toLowerCase().includes('duplicate column name')) {
      throw e;
    }
  }

  // Create users table if it doesn't exist
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role ENUM('superadmin', 'tournament_admin', 'manager', 'coach', 'staff', 'participant') NOT NULL DEFAULT 'participant',
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
  try {
    await pool.execute('ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }
  try {
    await pool.execute('ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(64) DEFAULT NULL');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }
  try {
    await pool.execute('ALTER TABLE users ADD COLUMN email_verified_at DATETIME DEFAULT NULL');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }

  // Add rules and available_courts to tournaments table
  try {
    await pool.execute('ALTER TABLE tournaments ADD COLUMN rules JSON DEFAULT NULL');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }
  try {
    await pool.execute('ALTER TABLE tournaments ADD COLUMN available_courts INT(11) DEFAULT 3');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }
  try {
    await pool.execute('ALTER TABLE tournaments ADD COLUMN price_single_category DECIMAL(10,2) DEFAULT NULL COMMENT "Price for one category (e.g., 30 EUR)"');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }
  try {
    await pool.execute('ALTER TABLE tournaments ADD COLUMN price_double_category DECIMAL(10,2) DEFAULT NULL COMMENT "Price per category if participating in two categories (e.g., 25 EUR per category)"');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }
  // Добавляем поля для адреса с координатами и расписания событий
  try {
    await pool.execute('ALTER TABLE tournaments ADD COLUMN location_address TEXT DEFAULT NULL COMMENT "Полный адрес проведения турнира"');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }
  try {
    await pool.execute('ALTER TABLE tournaments ADD COLUMN location_coordinates JSON DEFAULT NULL COMMENT "Координаты для Google Maps: {lat: number, lng: number}"');
  } catch (e: any) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }
  try {
    await pool.execute('ALTER TABLE tournaments ADD COLUMN event_schedule JSON DEFAULT NULL COMMENT "Расписание событий: [{title, date, time, description}]"');
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
      INDEX idx_token_lookup (token, expires_at),
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
      status ENUM('draft', 'open', 'closed', 'in_progress', 'completed', 'demo', 'archived') NOT NULL DEFAULT 'draft',
      demo_participants_count INT DEFAULT NULL,
      registration_settings JSON DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_status (status),
      INDEX idx_start_date (start_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Ensure 'demo' and 'archived' statuses exist in tournaments.status ENUM
  try {
    await pool.execute(`
      ALTER TABLE tournaments
      MODIFY status ENUM('draft', 'open', 'closed', 'in_progress', 'completed', 'demo', 'archived') NOT NULL DEFAULT 'draft'
    `);
  } catch (e: any) {
    // MySQL returns errno 1265 if enum already updated; ignore in that case
    if (!e.message?.toLowerCase().includes('enum')) {
      throw e;
    }
  }

  try {
    await pool.execute(`
      ALTER TABLE tournaments
      ADD COLUMN demo_participants_count INT DEFAULT NULL
    `);
  } catch (e: any) {
    if (!e.message?.toLowerCase().includes('duplicate column name')) {
      throw e;
    }
  }

  try {
    await pool.execute(`
      ALTER TABLE tournaments
      ADD COLUMN registration_settings JSON DEFAULT NULL
    `);
  } catch (e: any) {
    if (!e.message?.toLowerCase().includes('duplicate column name')) {
      throw e;
    }
  }

  try {
    await pool.execute(`
      ALTER TABLE tournaments
      ADD COLUMN custom_categories JSON DEFAULT NULL COMMENT "Custom category names: {code: name}"
    `);
  } catch (e: any) {
    if (!e.message?.toLowerCase().includes('duplicate column name')) {
      throw e;
    }
  }

  // Обновляем статусы, которые могли сохраниться как пустые строки после невалидного значения
  await pool.execute(`
    UPDATE tournaments
    SET status = 'draft'
    WHERE status IS NULL OR status = ''
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
      INDEX idx_group_pair_number (group_id, pair_number),
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
        can_manage_users BOOLEAN DEFAULT FALSE,
        can_manage_logs BOOLEAN DEFAULT FALSE,
        can_manage_tournaments BOOLEAN DEFAULT FALSE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_user (user_id),
        INDEX idx_tournament (tournament_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_tournament (user_id, tournament_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Добавляем новые колонки разрешений, если их еще нет
    try {
      await pool.execute('ALTER TABLE staff_tournament_access ADD COLUMN can_manage_users BOOLEAN DEFAULT FALSE');
    } catch (e: any) {
      if (!e.message.includes('Duplicate column name')) throw e;
    }
    try {
      await pool.execute('ALTER TABLE staff_tournament_access ADD COLUMN can_manage_logs BOOLEAN DEFAULT FALSE');
    } catch (e: any) {
      if (!e.message.includes('Duplicate column name')) throw e;
    }
    try {
      await pool.execute('ALTER TABLE staff_tournament_access ADD COLUMN can_manage_tournaments BOOLEAN DEFAULT FALSE');
    } catch (e: any) {
      if (!e.message.includes('Duplicate column name')) throw e;
    }

    // Create investment_requests table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS investment_requests (
        id INT(11) NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company VARCHAR(255) DEFAULT NULL,
        investment_size VARCHAR(50) NOT NULL,
        message TEXT DEFAULT NULL,
        status ENUM('pending', 'reviewed', 'contacted', 'rejected') NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create tournament_matches table (результаты матчей)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tournament_matches (
        id INT(11) NOT NULL AUTO_INCREMENT,
        group_id INT(11) NOT NULL,
        pair1_id INT(11) NOT NULL,
        pair2_id INT(11) NOT NULL,
        pair1_games INT(11) DEFAULT NULL,
        pair2_games INT(11) DEFAULT NULL,
        pair1_points INT(11) DEFAULT 0,
        pair2_points INT(11) DEFAULT 0,
        winner_pair_id INT(11) DEFAULT NULL,
        match_date DATETIME DEFAULT NULL,
        court_number INT(11) DEFAULT NULL,
        reported_at DATETIME DEFAULT NULL,
        reported_by VARCHAR(36) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_group (group_id),
        INDEX idx_pair1 (pair1_id),
        INDEX idx_pair2 (pair2_id),
        INDEX idx_match_date (match_date),
        FOREIGN KEY (group_id) REFERENCES tournament_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (pair1_id) REFERENCES tournament_group_pairs(id) ON DELETE CASCADE,
        FOREIGN KEY (pair2_id) REFERENCES tournament_group_pairs(id) ON DELETE CASCADE,
        UNIQUE KEY unique_match (group_id, pair1_id, pair2_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Add court_number if it doesn't exist
    try {
      await pool.execute('ALTER TABLE tournament_matches ADD COLUMN court_number INT(11) DEFAULT NULL');
    } catch (e: any) {
      if (!e.message.includes('Duplicate column name')) throw e;
    }

    // Add sets columns for knockout matches (СЕТ 1, СЕТ 2, СЕТ 3)
    const setsColumns = [
      'pair1_set1', 'pair1_set2', 'pair1_set3',
      'pair2_set1', 'pair2_set2', 'pair2_set3'
    ];
    for (const col of setsColumns) {
      try {
        await pool.execute(`ALTER TABLE tournament_matches ADD COLUMN ${col} INT(11) DEFAULT NULL`);
      } catch (e: any) {
        if (!e.message.includes('Duplicate column name')) throw e;
      }
    }

    // Create audit_logs table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT(11) NOT NULL AUTO_INCREMENT,
        user_id VARCHAR(36) DEFAULT NULL,
        user_email VARCHAR(255) DEFAULT NULL,
        user_role VARCHAR(50) DEFAULT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(255) DEFAULT NULL,
        details JSON DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_user (user_id),
        INDEX idx_action (action),
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Добавляем поле duration_slots в tournament_matches, если его нет
    try {
      await pool.execute('ALTER TABLE tournament_matches ADD COLUMN duration_slots INT(11) DEFAULT 1');
    } catch (e: any) {
      if (!e.message.includes('Duplicate column name')) throw e;
    }

    // Create user_wallets table (балансы пользователей)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_wallets (
        id INT(11) NOT NULL AUTO_INCREMENT,
        user_id VARCHAR(36) NOT NULL,
        balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY unique_user_wallet (user_id),
        INDEX idx_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create wallet_transactions table (транзакции)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INT(11) NOT NULL AUTO_INCREMENT,
        wallet_id INT(11) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        type ENUM('deposit', 'withdrawal', 'payment', 'refund', 'transfer') NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
        description TEXT DEFAULT NULL,
        reference_type VARCHAR(50) DEFAULT NULL,
        reference_id VARCHAR(255) DEFAULT NULL,
        status ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
        created_by VARCHAR(36) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_wallet (wallet_id),
        INDEX idx_user (user_id),
        INDEX idx_type (type),
        INDEX idx_status (status),
        INDEX idx_created (created_at),
        INDEX idx_reference (reference_type, reference_id),
        FOREIGN KEY (wallet_id) REFERENCES user_wallets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

