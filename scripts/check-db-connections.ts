// Script to check database connections
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkConnections() {
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

    console.log('✅ Connected to database\n');

    // Get process list
    const [processList] = await connection.execute('SHOW PROCESSLIST') as any[];
    
    // Get variables
    const [maxConnections] = await connection.execute("SHOW VARIABLES LIKE 'max_connections'") as any[];
    const [maxUserConnections] = await connection.execute("SHOW VARIABLES LIKE 'max_user_connections'") as any[];
    
    const maxConn = maxConnections[0]?.Value || 'unknown';
    const maxUserConn = maxUserConnections[0]?.Value || 'unknown';

    console.log(`📊 Connection Limits:`);
    console.log(`   Max connections (server): ${maxConn}`);
    console.log(`   Max user connections: ${maxUserConn}`);
    console.log(`   Current total connections: ${processList.length}\n`);

    // Filter by current user
    const userConnections = processList.filter((p: any) => p.User === user);
    console.log(`📊 Your user (${user}) connections: ${userConnections.length}/${maxUserConn}`);
    
    if (userConnections.length > 0) {
      console.log(`\n📋 Active connections:`);
      userConnections.forEach((proc: any) => {
        const timeStr = proc.Time >= 60 ? `${Math.floor(proc.Time / 60)}m ${proc.Time % 60}s` : `${proc.Time}s`;
        const state = proc.State || 'idle';
        const info = proc.Info ? proc.Info.substring(0, 80) : 'N/A';
        console.log(`   ID: ${proc.Id}, Time: ${timeStr}, State: ${state}, DB: ${proc.db || 'none'}`);
        if (info !== 'N/A') {
          console.log(`      Query: ${info}${proc.Info.length > 80 ? '...' : ''}`);
        }
      });
    }

    // Check for long-running queries
    const longRunning = userConnections.filter((p: any) => p.Time > 60);
    if (longRunning.length > 0) {
      console.log(`\n⚠️  Warning: ${longRunning.length} long-running connection(s) (>60s):`);
      longRunning.forEach((proc: any) => {
        console.log(`   ID: ${proc.Id}, Time: ${proc.Time}s, Query: ${proc.Info?.substring(0, 100) || 'N/A'}`);
      });
    }

    // Check for sleeping connections
    const sleeping = userConnections.filter((p: any) => p.Command === 'Sleep' && p.Time > 10);
    if (sleeping.length > 0) {
      console.log(`\n⚠️  Warning: ${sleeping.length} idle connection(s) (>10s):`);
      sleeping.forEach((proc: any) => {
        console.log(`   ID: ${proc.Id}, Time: ${proc.Time}s`);
      });
    }

    await connection.end();
    
    console.log(`\n✅ Check completed`);
    console.log(`💡 To close connections, run: npm run close-db-connections`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      console.error('\n⚠️  Cannot connect - too many connections!');
      console.error('💡 Please close connections manually via hosting panel or wait.');
    }
    process.exit(1);
  }
}

checkConnections()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });

