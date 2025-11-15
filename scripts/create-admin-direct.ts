// Прямое создание админа без использования пула соединений
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function createAdminDirect() {
  const host = process.env.DATABASE_HOST;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;
  const port = parseInt(process.env.DATABASE_PORT || '3306', 10);

  if (!host || !user || !password || !database) {
    console.error('❌ Database credentials not configured');
    process.exit(1);
  }

  let connection: mysql.Connection | null = null;

  try {
    // Создаем одно соединение напрямую
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      ssl: process.env.DATABASE_SSL === 'true' ? {
        rejectUnauthorized: false
      } : undefined,
    });

    console.log('✅ Connected to database');

    // Проверяем, существует ли уже админ
    const [existing] = await connection.execute(
      'SELECT id, email, role FROM users WHERE email = ?',
      ['admin@padelo2.com']
    ) as any[];

    if (existing.length > 0) {
      console.log('✅ Admin user already exists:');
      console.log(`   ID: ${existing[0].id}`);
      console.log(`   Email: ${existing[0].email}`);
      console.log(`   Role: ${existing[0].role}`);
      
      // Обновляем пароль на всякий случай
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.execute(
        'UPDATE users SET password_hash = ?, role = ? WHERE email = ?',
        [hashedPassword, 'superadmin', 'admin@padelo2.com']
      );
      console.log('✅ Password updated');
    } else {
      // Создаем нового админа
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const [result] = await connection.execute(
        `INSERT INTO users (id, email, password_hash, role, first_name, last_name, created_at, updated_at)
         VALUES (UUID(), ?, ?, ?, ?, ?, NOW(), NOW())`,
        ['admin@padelo2.com', hashedPassword, 'superadmin', 'Admin', 'User']
      ) as any[];

      console.log('✅ Admin user created successfully!');
      console.log('   Email: admin@padelo2.com');
      console.log('   Password: admin123');
      console.log('   Role: superadmin');
    }

    await connection.end();
    console.log('✅ Connection closed');
  } catch (error: any) {
    if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      console.error('❌ Error: Too many connections to database');
      console.error('   Please wait a few minutes and try again, or contact your hosting provider.');
      console.error('   Current limit: 50 connections per user');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        // Ignore
      }
    }
    process.exit(1);
  }
}

createAdminDirect()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });

