// Script to create a test tournament with status 'draft'
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function createTestTournament() {
  const host = process.env.DATABASE_HOST;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;
  const port = parseInt(process.env.DATABASE_PORT || '3306', 10);

  if (!host || !user || !password || !database) {
    console.error('❌ Database credentials not configured in .env.local');
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

    // Check if test tournament already exists
    const [existing] = await connection.execute(
      'SELECT * FROM tournaments WHERE name = ?',
      ['TEST TOURNAMENT - Draft']
    ) as any[];

    if (existing.length > 0) {
      console.log('✅ Test tournament already exists:');
      console.log(`   ID: ${existing[0].id}`);
      console.log(`   Name: ${existing[0].name}`);
      console.log(`   Status: ${existing[0].status}`);
      await connection.end();
      return existing[0].id;
    }

    // Create test tournament
    const startDate = new Date('2025-12-20T10:00:00');
    const endDate = new Date('2025-12-22T18:00:00');
    const registrationDeadline = new Date('2025-12-15T23:59:59');

    const [result] = await connection.execute(
      `INSERT INTO tournaments (name, description, start_date, end_date, registration_deadline, location, max_participants, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'TEST TOURNAMENT - Draft',
        'Тестовый турнир для проверки логики распределения по группам. Не публикуется на сайте.',
        startDate,
        endDate,
        registrationDeadline,
        'Test Location',
        200,
        'draft', // Черновик
      ]
    ) as any;

    const tournamentId = result.insertId;

    const [tournament] = await connection.execute(
      'SELECT * FROM tournaments WHERE id = ?',
      [tournamentId]
    ) as any[];

    console.log('✅ Test tournament created successfully:');
    console.log(`   ID: ${tournament[0].id}`);
    console.log(`   Name: ${tournament[0].name}`);
    console.log(`   Status: ${tournament[0].status} (draft - не публикуется)`);
    console.log(`   Start Date: ${tournament[0].start_date}`);
    console.log(`   End Date: ${tournament[0].end_date}`);

    await connection.end();
    return tournamentId;
  } catch (error: any) {
    console.error('❌ Error creating test tournament:', error.message);
    process.exit(1);
  }
}

createTestTournament()
  .then((tournamentId) => {
    console.log(`\n✅ Script completed. Tournament ID: ${tournamentId}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });

