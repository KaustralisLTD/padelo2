import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';
import { getAuditLogs } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

/**
 * GET - получить логи аудита с фильтрацией (только для superadmin)
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const userEmail = searchParams.get('userEmail') || undefined;
    const action = searchParams.get('action') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const entityId = searchParams.get('entityId') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const searchQuery = searchParams.get('searchQuery') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Получаем логи с фильтрами
    // Сначала получаем больше записей для фильтрации по userEmail и searchQuery
    let logs: any[] = [];
    try {
      logs = await getAuditLogs({
        userId,
        action,
        entityType,
        entityId,
        startDate,
        endDate,
        limit: 1000, // Получаем больше для фильтрации на сервере
        offset: 0,
      });

      // Логируем для отладки
      console.log(`📋 Fetched ${logs.length} audit logs from database`);
      if (logs.length > 0) {
        console.log(`📋 Sample log:`, JSON.stringify(logs[0], null, 2));
      }
    } catch (fetchError: any) {
      console.error('❌ Error in getAuditLogs:', fetchError);
      console.error('Error stack:', fetchError.stack);
      // Продолжаем с пустым массивом
      logs = [];
    }

    // Фильтруем по userEmail, userId и searchQuery на сервере
    try {
      if (userEmail) {
        logs = logs.filter(log => {
          const emailMatch = log.userEmail?.toLowerCase().includes(userEmail.toLowerCase());
          // Также проверяем affectedUserEmails в details для действий над парами
          const detailsMatch = log.details?.affectedUserEmails?.some((email: string) => 
            email?.toLowerCase().includes(userEmail.toLowerCase())
          );
          return emailMatch || detailsMatch;
        });
      }

      if (userId) {
        logs = logs.filter(log => {
          const idMatch = log.userId === userId;
          // Также проверяем affectedUserIds в details для действий над парами
          const detailsMatch = log.details?.affectedUserIds?.includes(userId);
          return idMatch || detailsMatch;
        });
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        logs = logs.filter(log => {
          try {
            const detailsStr = JSON.stringify(log.details || {});
            return (
              log.userEmail?.toLowerCase().includes(query) ||
              log.userId?.toLowerCase().includes(query) ||
              log.action?.toLowerCase().includes(query) ||
              log.entityType?.toLowerCase().includes(query) ||
              log.entityId?.toString().toLowerCase().includes(query) ||
              detailsStr.toLowerCase().includes(query) ||
              log.ipAddress?.toLowerCase().includes(query) ||
              log.userRole?.toLowerCase().includes(query)
            );
          } catch (filterError) {
            console.warn(`⚠️ Error filtering log ${log.id}:`, filterError);
            return false;
          }
        });
      }
    } catch (filterError: any) {
      console.error('❌ Error filtering logs:', filterError);
      // Продолжаем с текущими логами
    }

    // Подсчитываем общее количество после фильтрации
    const total = logs.length;

    // Применяем пагинацию
    const startIndex = offset;
    const endIndex = startIndex + limit;
    const paginatedLogs = logs.slice(startIndex, endIndex);

    const hasNextPage = endIndex < total;

    console.log(`📋 Returning ${paginatedLogs.length} logs (page ${page}, total ${total})`);

    return NextResponse.json({
      logs: paginatedLogs,
      total,
      page,
      limit,
      hasNextPage,
    });
  } catch (error: any) {
    console.error('❌ Error fetching audit logs:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch logs',
        logs: [],
        total: 0,
        page: 1,
        limit: 50,
        hasNextPage: false
      },
      { status: 500 }
    );
  }
}

