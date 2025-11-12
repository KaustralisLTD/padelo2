// Script to test database connection
// Run with: npx tsx scripts/test-db-connection.ts

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { getDbPool, initDatabase } from '../lib/db';

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...\n');
    
    // Check environment variables
    console.log('📋 Environment variables:');
    console.log(`   DATABASE_HOST: ${process.env.DATABASE_HOST || 'NOT SET'}`);
    console.log(`   DATABASE_PORT: ${process.env.DATABASE_PORT || 'NOT SET'}`);
    console.log(`   DATABASE_NAME: ${process.env.DATABASE_NAME || 'NOT SET'}`);
    console.log(`   DATABASE_USER: ${process.env.DATABASE_USER || 'NOT SET'}`);
    console.log(`   DATABASE_PASSWORD: ${process.env.DATABASE_PASSWORD ? '***SET***' : 'NOT SET'}\n`);
    
    if (!process.env.DATABASE_HOST || !process.env.DATABASE_USER || !process.env.DATABASE_PASSWORD || !process.env.DATABASE_NAME) {
      console.error('❌ Database credentials not configured!');
      console.error('\n📝 Please create .env.local file with:');
      console.error('   DATABASE_HOST=your_host');
      console.error('   DATABASE_PORT=3306');
      console.error('   DATABASE_NAME=your_database');
      console.error('   DATABASE_USER=your_user');
      console.error('   DATABASE_PASSWORD=your_password');
      process.exit(1);
    }
    
    // Initialize database (creates tables if needed)
    console.log('📊 Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized\n');
    
    // Test connection
    console.log('🔍 Testing connection...');
    const pool = getDbPool();
    const connection = await pool.getConnection();
    
    // Test query
    const [rows] = await connection.query('SELECT 1 as test') as any[];
    console.log('✅ Connection successful!');
    console.log(`   Test query result: ${JSON.stringify(rows[0])}\n`);
    
    // Check tables
    console.log('📋 Checking tables...');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DATABASE_NAME]) as any[];
    
    console.log(`   Found ${tables.length} tables:`);
    tables.forEach((table: any) => {
      console.log(`   - ${table.TABLE_NAME}`);
    });
    
    // Check users
    console.log('\n👥 Checking users...');
    try {
      const [users] = await connection.query('SELECT COUNT(*) as count FROM users') as any[];
      console.log(`   Total users: ${users[0].count}`);
      
      if (users[0].count > 0) {
        const [userList] = await connection.query(`
          SELECT email, role, created_at 
          FROM users 
          LIMIT 5
        `) as any[];
        console.log('   Sample users:');
        userList.forEach((user: any) => {
          console.log(`   - ${user.email} (${user.role})`);
        });
      }
    } catch (error: any) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log('   ⚠️  Users table not found (will be created on first use)');
      } else {
        throw error;
      }
    }
    
    connection.release();
    
    console.log('\n✅ Database connection test completed successfully!');
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Database connection failed!');
    console.error(`   Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Possible solutions:');
      console.error('   1. Check DATABASE_HOST is correct');
      console.error('   2. Check if database server is running');
      console.error('   3. Check if port is correct (usually 3306)');
      console.error('   4. Check firewall settings');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Possible solutions:');
      console.error('   1. Check DATABASE_USER is correct');
      console.error('   2. Check DATABASE_PASSWORD is correct');
      console.error('   3. Check if user has access to database');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Possible solutions:');
      console.error('   1. Check DATABASE_NAME is correct');
      console.error('   2. Create database if it doesn\'t exist');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      console.error('\n💡 Possible solutions:');
      console.error('   1. Check DATABASE_HOST is correct');
      console.error('   2. Check internet connection');
      console.error('   3. Check if remote database allows your IP');
    }
    
    process.exit(1);
  }
}

testConnection();

