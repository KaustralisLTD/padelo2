'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

interface AuditLog {
  id: number;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AdminLogsContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    userEmail: '',
    action: '',
    entityType: '',
    entityId: '',
    startDate: '',
    endDate: '',
    searchQuery: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [users, setUsers] = useState<Array<{ id: string; email: string; role: string }>>([]);
  const itemsPerPage = 50;

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    // Verify admin access
    fetch('/api/auth/login', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.session || data.session.role !== 'superadmin') {
          router.push(`/${locale}/dashboard`);
        } else {
          fetchUsers();
          fetchLogs();
        }
      })
      .catch(() => {
        router.push(`/${locale}/login`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLogs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.userEmail) params.append('userEmail', filters.userEmail);
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.entityId) params.append('entityId', filters.entityId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.searchQuery) params.append('searchQuery', filters.searchQuery);
      params.append('page', page.toString());
      params.append('limit', itemsPerPage.toString());

      const response = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 AdminLogsContent: Received data:', { 
          logsCount: data.logs?.length, 
          total: data.total,
          page: data.page,
          limit: data.limit,
          hasNextPage: data.hasNextPage
        });
        if (data.logs && data.logs.length > 0) {
          console.log('📋 AdminLogsContent: Sample log:', data.logs[0]);
        }
        setLogs(data.logs || []);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ AdminLogsContent: Failed to fetch logs:', response.status, errorData);
        setLogs([]);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('❌ AdminLogsContent: Error fetching logs:', error);
      setLogs([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1); // Сбрасываем на первую страницу при изменении фильтров
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      userEmail: '',
      action: '',
      entityType: '',
      entityId: '',
      startDate: '',
      endDate: '',
      searchQuery: '',
    });
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'text-green-400';
      case 'update':
        return 'text-blue-400';
      case 'delete':
        return 'text-red-400';
      case 'error':
        return 'text-red-500 font-bold';
      case 'generate':
        return 'text-purple-400';
      default:
        return 'text-text-secondary';
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    return t(`logs.entityTypes.${entityType}`) || entityType;
  };

  const getActionLabel = (action: string) => {
    return t(`logs.actions.${action}`) || action;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="w-full px-4 py-8">
        <div className="text-center">
          <p className="text-text-secondary font-poppins">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text">
          {t('logs.title')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins">
          {t('logs.description')}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-background-secondary rounded-lg border border-border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="md:col-span-2 lg:col-span-4">
              <label className="block text-sm font-poppins text-text-secondary mb-1">
                {t('logs.search')}
              </label>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                placeholder={t('logs.searchPlaceholder')}
                className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
              />
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-1">
                {t('logs.user')}
              </label>
              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
              >
                <option value="">{t('logs.allUsers')}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-1">
                {t('logs.action')}
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
              >
                <option value="">{t('logs.allActions')}</option>
                <option value="create">{t('logs.actions.create')}</option>
                <option value="update">{t('logs.actions.update')}</option>
                <option value="delete">{t('logs.actions.delete')}</option>
                <option value="generate">{t('logs.actions.generate')}</option>
                <option value="error">{t('logs.actions.error')}</option>
              </select>
            </div>

            {/* Entity Type Filter */}
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-1">
                {t('logs.entityType')}
              </label>
              <select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
              >
                <option value="">{t('logs.allEntityTypes')}</option>
                <option value="user">{t('logs.entityTypes.user')}</option>
                <option value="tournament">{t('logs.entityTypes.tournament')}</option>
                <option value="pair">{t('logs.entityTypes.pair')}</option>
                <option value="match">{t('logs.entityTypes.match')}</option>
                <option value="schedule">{t('logs.entityTypes.schedule')}</option>
                <option value="registration">{t('logs.entityTypes.registration')}</option>
              </select>
            </div>

            {/* Entity ID Filter */}
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-1">
                {t('logs.entityId')}
              </label>
              <input
                type="text"
                value={filters.entityId}
                onChange={(e) => handleFilterChange('entityId', e.target.value)}
                placeholder={t('logs.entityIdPlaceholder')}
                className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-1">
                {t('logs.startDate')}
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-poppins text-text-secondary mb-1">
                {t('logs.endDate')}
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full p-2 bg-background border border-border rounded-lg text-text font-poppins"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-background-secondary text-text border border-border rounded-lg hover:border-primary transition-colors font-poppins text-sm"
            >
              {t('logs.clearFilters')}
            </button>
          </div>
        </div>

      {/* Logs Table */}
      {logs.length === 0 ? (
        <div className="bg-background-secondary rounded-lg border border-border p-8 text-center">
          <p className="text-text-secondary font-poppins">{t('logs.noLogs')}</p>
        </div>
      ) : (
        <>
          <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('logs.dateTime')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('logs.user')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('logs.action')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('logs.entityType')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('logs.entityId')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('logs.details')}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-poppins font-semibold text-text">
                      {t('logs.ipAddress')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-background/50">
                      <td className="px-6 py-4 text-text-secondary font-poppins text-sm">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins text-sm">
                        <div>
                          {log.userEmail || '-'}
                          {log.userRole && (
                            <span className="text-xs text-text-secondary ml-1">
                              ({log.userRole})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-poppins font-semibold text-sm ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins text-sm">
                        {getEntityTypeLabel(log.entityType)}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins text-sm">
                        {log.entityId || '-'}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins text-xs max-w-md">
                        {log.details ? (
                          <details className="cursor-pointer">
                            <summary className="text-primary hover:text-accent">
                              {t('logs.viewDetails')}
                            </summary>
                            <pre className="mt-2 p-2 bg-background rounded border border-border text-xs overflow-auto max-h-40">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins text-xs">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-background-secondary text-text border border-border rounded-lg hover:border-primary transition-colors font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('logs.previous')}
              </button>
              <span className="text-text-secondary font-poppins">
                {t('logs.page')} {page} {t('logs.of')} {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-background-secondary text-text border border-border rounded-lg hover:border-primary transition-colors font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('logs.next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

