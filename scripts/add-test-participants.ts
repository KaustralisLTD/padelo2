// Script to add test participants to the test tournament
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Random names for male participants
const maleFirstNames = [
  'John', 'Michael', 'David', 'James', 'Robert', 'William', 'Richard', 'Joseph',
  'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald',
  'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George',
  'Timothy', 'Ronald', 'Jason', 'Edward', 'Jeffrey', 'Ryan', 'Jacob', 'Gary',
  'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin'
];

const maleLastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen',
  'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams'
];

// Random names for female participants
const femaleFirstNames = [
  'Emma', 'Olivia', 'Sophia', 'Isabella', 'Charlotte', 'Amelia', 'Mia', 'Harper',
  'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Mila', 'Ella', 'Avery', 'Sofia',
  'Camila', 'Aria', 'Scarlett', 'Victoria', 'Madison', 'Luna', 'Grace', 'Chloe',
  'Penelope', 'Layla', 'Riley', 'Zoey', 'Nora', 'Lily', 'Eleanor', 'Hannah',
  'Lillian', 'Addison', 'Aubrey', 'Ellie', 'Stella', 'Natalie', 'Zoe', 'Leah'
];

const femaleLastNames = [
  'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson',
  'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

function generateRandomName(firstNames: string[], lastNames: string[]): { firstName: string; lastName: string } {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return { firstName, lastName };
}

function generateEmail(firstName: string, lastName: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@test.padelo2.com`;
}

function generatePhone(): string {
  return `+380${Math.floor(100000000 + Math.random() * 900000000)}`;
}

async function addTestParticipants() {
  const host = process.env.DATABASE_HOST;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;
  const port = parseInt(process.env.DATABASE_PORT || '3306', 10);

  if (!host || !user || !password || !database) {
    console.error('❌ Database credentials not configured');
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

    // Find test tournament
    const [tournaments] = await connection.execute(
      'SELECT * FROM tournaments WHERE name = ?',
      ['TEST TOURNAMENT - Draft']
    ) as any[];

    if (tournaments.length === 0) {
      console.error('❌ Test tournament not found. Run create-test-tournament.ts first');
      await connection.end();
      process.exit(1);
    }

    const tournamentId = tournaments[0].id;
    console.log(`✅ Found test tournament ID: ${tournamentId}`);

    // Check if participants already exist
    const [existing] = await connection.execute(
      'SELECT COUNT(*) as count FROM tournament_registrations WHERE tournament_id = ?',
      [tournamentId]
    ) as any[];

    if (existing[0].count > 0) {
      console.log(`⚠️  Tournament already has ${existing[0].count} participants. Deleting existing...`);
      await connection.execute(
        'DELETE FROM tournament_registrations WHERE tournament_id = ?',
        [tournamentId]
      );
    }

    const participants: any[] = [];

    // 40 мужчин:
    // - 16 в Мужском 1 (male1)
    // - 24 в Мужском 2 (male2)
    // - Из них 10 также в Миксте 1 (mixed1) - первые 10 из male1
    // - И 10 также в Миксте 2 (mixed2) - первые 10 из male2

    console.log('\n📝 Creating 40 male participants...');
    
    // 16 мужчин в male1 (первые 10 также в mixed1)
    for (let i = 0; i < 16; i++) {
      const { firstName, lastName } = generateRandomName(maleFirstNames, maleLastNames);
      const categories = ['male1'];
      if (i < 10) {
        categories.push('mixed1'); // Первые 10 также в mixed1
      }
      
      participants.push({
        firstName,
        lastName,
        email: generateEmail(firstName, lastName),
        phone: generatePhone(),
        categories,
        tshirtSize: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
      });
    }

    // 24 мужчины в male2 (первые 10 также в mixed2)
    for (let i = 0; i < 24; i++) {
      const { firstName, lastName } = generateRandomName(maleFirstNames, maleLastNames);
      const categories = ['male2'];
      if (i < 10) {
        categories.push('mixed2'); // Первые 10 также в mixed2
      }
      
      participants.push({
        firstName,
        lastName,
        email: generateEmail(firstName, lastName),
        phone: generatePhone(),
        categories,
        tshirtSize: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
      });
    }

    // Дополнительно в Миксте 1: еще 22 игрока (женщины)
    console.log('📝 Adding 22 additional female participants to mixed1...');
    for (let i = 0; i < 22; i++) {
      const { firstName, lastName } = generateRandomName(femaleFirstNames, femaleLastNames);
      participants.push({
        firstName,
        lastName,
        email: generateEmail(firstName, lastName),
        phone: generatePhone(),
        categories: ['mixed1'],
        tshirtSize: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
      });
    }

    // Дополнительно в Миксте 2: еще 22 игрока (женщины)
    console.log('📝 Adding 22 additional female participants to mixed2...');
    for (let i = 0; i < 22; i++) {
      const { firstName, lastName } = generateRandomName(femaleFirstNames, femaleLastNames);
      participants.push({
        firstName,
        lastName,
        email: generateEmail(firstName, lastName),
        phone: generatePhone(),
        categories: ['mixed2'],
        tshirtSize: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
      });
    }

    // 32 женщины:
    // - 8 в Женском 1 (female1)
    // - 24 в Женском 2 (female2)
    // - Часть из них также в Микстах (6 из female1 в mixed1, 10 из female2 в mixed2)
    console.log('📝 Creating 32 female participants...');
    
    // 8 женщин в female1 (6 из них также в mixed1)
    for (let i = 0; i < 8; i++) {
      const { firstName, lastName } = generateRandomName(femaleFirstNames, femaleLastNames);
      const categories = ['female1'];
      if (i < 6) {
        categories.push('mixed1'); // 6 из них также в mixed1
      }
      
      participants.push({
        firstName,
        lastName,
        email: generateEmail(firstName, lastName),
        phone: generatePhone(),
        categories,
        tshirtSize: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
      });
    }

    // 24 женщины в female2 (10 из них также в mixed2)
    for (let i = 0; i < 24; i++) {
      const { firstName, lastName } = generateRandomName(femaleFirstNames, femaleLastNames);
      const categories = ['female2'];
      if (i < 10) {
        categories.push('mixed2'); // 10 из них также в mixed2
      }
      
      participants.push({
        firstName,
        lastName,
        email: generateEmail(firstName, lastName),
        phone: generatePhone(),
        categories,
        tshirtSize: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
      });
    }

    console.log(`\n📊 Total participants to create: ${participants.length}`);
    console.log('📝 Inserting participants into database...\n');

    // Insert all participants
    let inserted = 0;
    for (const participant of participants) {
      const token = crypto.randomBytes(32).toString('hex');
      
      await connection.execute(
        `INSERT INTO tournament_registrations (
          token, tournament_id, user_id, tournament_name, locale,
          first_name, last_name, email, phone,
          categories, tshirt_size, confirmed, created_at
        ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          token,
          tournamentId,
          'TEST TOURNAMENT - Draft',
          'en',
          participant.firstName,
          participant.lastName,
          participant.email,
          participant.phone,
          JSON.stringify(participant.categories),
          participant.tshirtSize,
          true, // Все подтверждены
        ]
      );
      
      inserted++;
      if (inserted % 10 === 0) {
        process.stdout.write(`   Inserted ${inserted}/${participants.length}...\r`);
      }
    }

    console.log(`\n✅ Successfully inserted ${inserted} participants`);

    // Count by category
    const [categoryStats] = await connection.execute(
      `SELECT 
        SUM(JSON_CONTAINS(categories, '"male1"')) as male1,
        SUM(JSON_CONTAINS(categories, '"male2"')) as male2,
        SUM(JSON_CONTAINS(categories, '"female1"')) as female1,
        SUM(JSON_CONTAINS(categories, '"female2"')) as female2,
        SUM(JSON_CONTAINS(categories, '"mixed1"')) as mixed1,
        SUM(JSON_CONTAINS(categories, '"mixed2"')) as mixed2
       FROM tournament_registrations
       WHERE tournament_id = ? AND confirmed = TRUE`,
      [tournamentId]
    ) as any[];

    const stats = categoryStats[0];
    console.log('\n📊 Participants by category:');
    console.log(`   Male 1: ${stats.male1}`);
    console.log(`   Male 2: ${stats.male2}`);
    console.log(`   Female 1: ${stats.female1}`);
    console.log(`   Female 2: ${stats.female2}`);
    console.log(`   Mixed 1: ${stats.mixed1} (should be 10+22+6=38)`);
    console.log(`   Mixed 2: ${stats.mixed2} (should be 10+22+10=42)`);

    await connection.end();
    console.log('\n✅ Script completed successfully');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      console.error('⚠️  Too many database connections. Please wait a moment and try again.');
    }
    process.exit(1);
  }
}

addTestParticipants()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });

