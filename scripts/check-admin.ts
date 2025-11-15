// Script to check if admin exists in database
import dotenv from 'dotenv';
import path from 'path';
import { getDbPool } from '../lib/db';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkAdmin() {
  try {
    const pool = getDbPool();
    const [users] = await pool.execute(
      'SELECT email, role, created_at FROM users WHERE email = ?',
      ['admin@padelo2.com']
    ) as any[];

    if (users.length > 0) {
      console.log('✅ Admin EXISTS in database');
      console.log(`   Email: ${users[0].email}`);
      console.log(`   Role: ${users[0].role}`);
      console.log(`   Created: ${users[0].created_at}`);
    } else {
      console.log('❌ Admin NOT FOUND in database');
      console.log('   Run: npm run create-admin');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

checkAdmin();

