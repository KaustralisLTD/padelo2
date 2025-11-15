// Script to close database connections
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function closeConnections() {
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

    // Get current process ID
    const [processList] = await connection.execute(
      `SHOW PROCESSLIST`
    ) as any[];

    console.log(`\n📊 Current connections: ${processList.length}`);
    
    // Get current user's connections
    const userConnections = processList.filter((p: any) => p.User === user);
    console.log(`📊 Your user connections: ${userConnections.length}`);

    // Close all connections except current one
    let closed = 0;
    for (const proc of userConnections) {
      if (proc.Id !== connection.threadId) {
        try {
          await connection.execute(`KILL ${proc.Id}`);
          closed++;
          console.log(`   ✅ Closed connection ${proc.Id} (${proc.Time}s, ${proc.State || 'idle'})`);
        } catch (error: any) {
          console.log(`   ⚠️  Could not close connection ${proc.Id}: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ Closed ${closed} connections`);
    console.log(`📊 Remaining connections: ${userConnections.length - closed}`);

    await connection.end();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
      console.error('\n⚠️  Cannot connect to close connections. Please contact your hosting provider or wait.');
    }
    process.exit(1);
  }
}

closeConnections()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err);
    process.exit(1);
  });

