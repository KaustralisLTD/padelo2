// Script to create admin user manually
// Run with: npx tsx scripts/create-admin.ts

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { initDatabase, getDbPool } from '../lib/db';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

async function createAdmin() {
  try {
    // Initialize database
    await initDatabase();
    
    const pool = getDbPool();
    
    // Check if admin already exists
    const [existing] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@padelo2.com']
    ) as any[];
    
    if (existing.length > 0) {
      console.log('Admin user already exists!');
      console.log('Email:', existing[0].email);
      console.log('Role:', existing[0].role);
      console.log('\nTo reset password, delete the user first or update it via admin panel.');
      return;
    }
    
    // Create admin
    const adminId = require('crypto').randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
    
    await pool.execute(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [adminId, 'admin@padelo2.com', passwordHash, 'Super', 'Admin', 'superadmin']
    );
    
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@padelo2.com');
    console.log('Password: admin123');
    console.log('Role: superadmin');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating admin:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Database connection failed. Check your .env.local file:');
      console.error('   DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n⚠️  Database access denied. Check your credentials.');
    } else {
      console.error('\n⚠️  Using in-memory storage (no database configured).');
      console.error('   Admin will be created in memory but will be lost on server restart.');
    }
    
    process.exit(1);
  }
}

createAdmin();

