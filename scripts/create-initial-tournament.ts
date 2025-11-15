// Script to create initial UA Padel Open tournament
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function createInitialTournament() {
  const host = process.env.DATABASE_HOST;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;
  const port = parseInt(process.env.DATABASE_PORT || '3306', 10);

  if (!host || !user || !password || !database) {
    console.error('❌ Database credentials not configured in .env.local');
    console.error('Required: DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME');
    process.exit(1);
  }

  try {
    const connection = await mysql.createConnection({
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

    // Check if tournament already exists
    const [existing] = await connection.execute(
      'SELECT * FROM tournaments WHERE name LIKE ?',
      ['%UA PADEL OPEN%']
    ) as any[];

    if (existing.length > 0) {
      console.log('✅ UA Padel Open tournament already exists:');
      console.log(`   ID: ${existing[0].id}`);
      console.log(`   Name: ${existing[0].name}`);
      console.log(`   Status: ${existing[0].status}`);
      await connection.end();
      return;
    }

    // Create UA Padel Open tournament
    // Winter 2025 - примерные даты
    const startDate = new Date('2025-12-01T10:00:00');
    const endDate = new Date('2025-12-15T18:00:00');
    const registrationDeadline = new Date('2025-11-25T23:59:59');

    const [result] = await connection.execute(
      `INSERT INTO tournaments (name, description, start_date, end_date, registration_deadline, location, max_participants, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'UA PADEL OPEN',
        'Winter 2025 tournament in Ukraine. Join the biggest padel event of the season!',
        startDate,
        endDate,
        registrationDeadline,
        'Ukraine',
        200,
        'open',
      ]
    ) as any;

    const tournamentId = result.insertId;

    const [tournament] = await connection.execute(
      'SELECT * FROM tournaments WHERE id = ?',
      [tournamentId]
    ) as any[];

    console.log('✅ UA Padel Open tournament created successfully:');
    console.log(`   ID: ${tournament[0].id}`);
    console.log(`   Name: ${tournament[0].name}`);
    console.log(`   Start Date: ${tournament[0].start_date}`);
    console.log(`   End Date: ${tournament[0].end_date}`);
    console.log(`   Status: ${tournament[0].status}`);

    await connection.end();
  } catch (error: any) {
    console.error('❌ Error creating tournament:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️  Database connection failed. Check your .env.local configuration.');
    }
    process.exit(1);
  }
}

createInitialTournament()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

