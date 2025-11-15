import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getPoolStats, getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET - получить статистику пула соединений БД (только для superadmin)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(token);
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const poolStats = getPoolStats();
    
    // Также получаем информацию о процессах из БД
    let dbProcesses = null;
    try {
      const pool = getDbPool();
      const [processes] = await pool.execute('SHOW PROCESSLIST') as any[];
      const currentUser = process.env.DATABASE_USER;
      
      dbProcesses = {
        total: processes.length,
        userConnections: processes.filter((p: any) => p.User === currentUser).length,
        processes: processes
          .filter((p: any) => p.User === currentUser)
          .map((p: any) => ({
            id: p.Id,
            user: p.User,
            host: p.Host,
            db: p.db,
            command: p.Command,
            time: p.Time,
            state: p.State,
            info: p.Info?.substring(0, 100) || null,
          })),
      };
    } catch (error: any) {
      console.error('Error getting DB processes:', error);
    }

    return NextResponse.json({
      pool: poolStats,
      dbProcesses,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching DB stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch DB stats' },
      { status: 500 }
    );
  }
}

