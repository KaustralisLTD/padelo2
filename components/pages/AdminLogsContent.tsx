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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const itemsPerPage = 50;

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  // Функция для копирования в буфер обмена
  const copyToClipboard = async (text: string, fieldId: string) => {
    if (!text || text === '—' || text === '-') return;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Компонент для отображения поля с иконкой копирования
  const CopyableField = ({ 
    value, 
    fieldId, 
    children, 
    className = '' 
  }: { 
    value: string | null | undefined; 
    fieldId: string; 
    children?: React.ReactNode;
    className?: string;
  }) => {
    const displayValue = value || '—';
    const isCopied = copiedField === fieldId;
    const canCopy = value && value !== '—' && value !== '-';

    return (
      <div className={`flex items-center gap-1.5 group ${className}`}>
        <span 
          className={canCopy ? 'cursor-pointer hover:text-primary transition-colors' : ''}
          onClick={() => canCopy && copyToClipboard(value!, fieldId)}
        >
          {children || displayValue}
        </span>
        {canCopy && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(value!, fieldId);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-primary/20 rounded"
            title={isCopied ? 'Скопировано' : 'Копировать'}
          >
            {isCopied ? (
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
      </div>
    );
  };

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

  // Функция для форматирования деталей лога в читабельный вид
  const formatLogDetails = (log: AuditLog) => {
    if (!log.details) return null;
    
    const details = log.details;
    
    // Для регистрации на турнир
    if (log.action === 'register' && log.entityType === 'tournament_registration') {
      return (
        <div className="space-y-2">
          <div><strong>Tournament:</strong> {details.tournamentName || details.tournamentId || '-'}</div>
          {details.categories && Array.isArray(details.categories) && details.categories.length > 0 && (
            <div><strong>Categories:</strong> {details.categories.join(', ')}</div>
          )}
          {details.partner && (
            <div>
              <strong>Partner:</strong> {details.partner.name || '-'}
              {details.partner.email && <span className="text-text-tertiary"> ({details.partner.email})</span>}
            </div>
          )}
          {details.categoryPartners && Object.keys(details.categoryPartners).length > 0 && (
            <div>
              <strong>Category Partners:</strong>
              <ul className="ml-4 mt-1 list-disc">
                {Object.entries(details.categoryPartners).map(([category, partner]: [string, any]) => (
                  <li key={category}>
                    {category}: {partner.name || '-'} {partner.email && <span className="text-text-tertiary">({partner.email})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {details.children && Array.isArray(details.children) && details.children.length > 0 && (
            <div>
              <strong>Children:</strong>
              <ul className="ml-4 mt-1 list-disc">
                {details.children.map((child: any, idx: number) => (
                  <li key={idx}>
                    {child.firstName} {child.lastName} {child.email && <span className="text-text-tertiary">({child.email})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {details.userMessage && (
            <div><strong>User Message:</strong> <span className="text-text-tertiary italic">{details.userMessage}</span></div>
          )}
          {details.emailVerified !== undefined && (
            <div><strong>Email Verified:</strong> {details.emailVerified ? 'Yes' : 'No'}</div>
          )}
          {details.tournamentDetails && (
            <div className="mt-2 pt-2 border-t border-border">
              <strong>Tournament Details:</strong>
              <ul className="ml-4 mt-1 list-disc text-text-tertiary">
                {details.tournamentDetails.startDate && <li>Start: {new Date(details.tournamentDetails.startDate).toLocaleDateString()}</li>}
                {details.tournamentDetails.endDate && <li>End: {new Date(details.tournamentDetails.endDate).toLocaleDateString()}</li>}
                {details.tournamentDetails.location && <li>Location: {details.tournamentDetails.location}</li>}
              </ul>
            </div>
          )}
        </div>
      );
    }
    
    // Для подтверждения регистрации
    if (log.action === 'confirm' && log.entityType === 'tournament_registration') {
      return (
        <div className="space-y-2">
          <div><strong>Tournament:</strong> {details.tournamentName || details.tournamentId || '-'}</div>
          {details.categories && Array.isArray(details.categories) && details.categories.length > 0 && (
            <div><strong>Categories:</strong> {details.categories.join(', ')}</div>
          )}
          {details.confirmedAt && (
            <div><strong>Confirmed At:</strong> {new Date(details.confirmedAt).toLocaleString()}</div>
          )}
        </div>
      );
    }
    
    // Для отправки email
    if (log.action === 'send_email') {
      return (
        <div className="space-y-2">
          <div><strong>Email Type:</strong> {details.emailType || '-'}</div>
          {details.tournamentName && (
            <div><strong>Tournament:</strong> {details.tournamentName}</div>
          )}
          {details.categories && Array.isArray(details.categories) && details.categories.length > 0 && (
            <div><strong>Categories:</strong> {details.categories.join(', ')}</div>
          )}
          {details.locale && (
            <div><strong>Locale:</strong> {details.locale}</div>
          )}
          {details.hasTemporaryPassword !== undefined && (
            <div><strong>Has Temporary Password:</strong> {details.hasTemporaryPassword ? 'Yes' : 'No'}</div>
          )}
        </div>
      );
    }
    
    // Для верификации email
    if (log.action === 'verify_email') {
      return (
        <div className="space-y-2">
          <div><strong>Verified At:</strong> {details.verifiedAt ? new Date(details.verifiedAt).toLocaleString() : '-'}</div>
        </div>
      );
    }
    
    // Для остальных случаев - JSON формат
    return (
      <pre className="text-xs overflow-auto">
        {JSON.stringify(details, null, 2)}
      </pre>
    );
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
    <div className="w-full px-4 py-8 pt-20">
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
                <option value="login">{t('logs.actions.login')}</option>
                <option value="logout">{t('logs.actions.logout')}</option>
                <option value="send_email">{t('logs.actions.send_email')}</option>
                <option value="register">{t('logs.actions.register')}</option>
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
                <option value="tournament_registration">{t('logs.entityTypes.tournament_registration')}</option>
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
            <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full min-w-[1600px]">
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
                      <div className="flex items-center gap-2">
                        <span>{t('logs.entityId')}</span>
                        <div className="group relative">
                          <svg className="w-4 h-4 text-text-secondary cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-background-secondary border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] text-xs text-text-secondary font-poppins pointer-events-none">
                            {t('logs.entityIdTooltip') || 'ID сущности, к которой относится действие (например, ID турнира, пользователя или пары). Для действий с парами также отображаются затронутые пользователи.'}
                          </div>
                        </div>
                      </div>
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
                          <CopyableField value={log.userEmail || null} fieldId={`user-email-${log.id}`}>
                            {log.userEmail || '-'}
                          </CopyableField>
                          {log.userId && (
                            <div className="text-xs text-text-secondary mt-1 flex items-center gap-1.5">
                              ID: <CopyableField value={log.userId} fieldId={`user-id-${log.id}`}>
                                {log.userId}
                              </CopyableField>
                            </div>
                          )}
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
                        <div>
                          <CopyableField value={log.entityId || null} fieldId={`entity-id-${log.id}`}>
                            {log.entityId || '-'}
                          </CopyableField>
                          {log.entityType === 'pair' && log.details?.affectedUserIds && Array.isArray(log.details.affectedUserIds) && log.details.affectedUserIds.length > 0 && (
                            <div className="text-xs text-text-secondary mt-1">
                              {t('logs.affectedUsers')}: {log.details.affectedUserIds.join(', ')}
                            </div>
                          )}
                          {log.entityType === 'pair' && log.details?.affectedUserEmails && Array.isArray(log.details.affectedUserEmails) && log.details.affectedUserEmails.length > 0 && (
                            <div className="text-xs text-text-secondary mt-1">
                              {t('logs.affectedEmails')}: {log.details.affectedUserEmails.join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-poppins text-xs max-w-md">
                        {log.details ? (
                          <details className="cursor-pointer">
                            <summary className="text-primary hover:text-accent">
                              {t('logs.viewDetails')}
                            </summary>
                            <div className="mt-2 p-3 bg-background rounded border border-border text-xs overflow-auto max-h-60">
                              {formatLogDetails(log)}
                            </div>
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

