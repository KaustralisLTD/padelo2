'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PoolStats {
  active: number;
  free: number;
  queued: number;
  limit: number;
  stats?: {
    totalAcquired?: number;
    totalReleased?: number;
    errors?: number;
  };
}

interface DbProcess {
  id: number;
  user: string;
  host: string;
  db: string | null;
  command: string;
  time: number;
  state: string | null;
  info: string | null;
}

interface DbStatsResponse {
  pool: PoolStats | null;
  dbProcesses: {
    total: number;
    userConnections: number;
    processes: DbProcess[];
  } | null;
  timestamp: string;
}

export default function AdminDbMonitorContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();

  const [stats, setStats] = useState<DbStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    fetch('/api/auth/login', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.session || data.session.role !== 'superadmin') {
          router.push(`/${locale}/dashboard`);
        } else {
          fetchStats();
        }
      })
      .catch(() => {
        router.push(`/${locale}/login`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  const fetchStats = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/db-stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        setError(t('dbMonitor.unauthorized'));
        return;
      }

      if (!response.ok) {
        throw new Error('Failed');
      }

      const data: DbStatsResponse = await response.json();
      setStats(data);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Error fetching DB stats:', err);
      setError(t('dbMonitor.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined) return t('dbMonitor.unknown');
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}m ${remainder}s`;
  };

  const poolCards = useMemo(() => {
    if (!stats?.pool) return [];
    const pool = stats.pool;
    return [
      { label: t('dbMonitor.poolStatsActive'), value: pool.active },
      { label: t('dbMonitor.poolStatsFree'), value: pool.free },
      { label: t('dbMonitor.poolStatsQueued'), value: pool.queued },
      { label: t('dbMonitor.poolStatsLimit'), value: pool.limit },
      { label: t('dbMonitor.poolStatsAcquired'), value: pool.stats?.totalAcquired ?? 0 },
      { label: t('dbMonitor.poolStatsReleased'), value: pool.stats?.totalReleased ?? 0 },
      { label: t('dbMonitor.poolStatsErrors'), value: pool.stats?.errors ?? 0 },
    ];
  }, [stats, t]);

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/${locale}/dashboard`}
            className="text-text-secondary hover:text-primary font-poppins transition-colors"
          >
            ← {t('backToDashboard')}
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-2 gradient-text">
              {t('dbMonitor.title')}
            </h1>
            <p className="text-xl text-text-secondary font-poppins">
              {t('dbMonitor.description')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-text-secondary font-poppins text-sm">
                {t('dbMonitor.lastUpdated')}: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity font-poppins text-sm"
            >
              {t('dbMonitor.refresh')}
            </button>
          </div>
        </div>

        {loading && !stats ? (
          <div className="bg-background-secondary rounded-lg border border-border p-8 text-center">
            <p className="text-text-secondary font-poppins">{t('loading')}</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-6">
            {error}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pool stats */}
            <div className="bg-background-secondary rounded-lg border border-border p-6">
              <h2 className="text-2xl font-poppins font-semibold mb-4 text-text">
                {t('dbMonitor.poolStatsTitle')}
              </h2>
              {stats?.pool ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {poolCards.map((card) => (
                    <div key={card.label} className="bg-background rounded-lg border border-border p-4">
                      <div className="text-sm text-text-secondary font-poppins mb-1">{card.label}</div>
                      <div className="text-2xl font-orbitron text-text">{card.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary font-poppins text-sm">
                  {t('dbMonitor.noProcesses')}
                </p>
              )}
            </div>

            {/* Connection summary */}
            {stats?.dbProcesses && (
              <div className="bg-background-secondary rounded-lg border border-border p-6">
                <h2 className="text-2xl font-poppins font-semibold mb-4 text-text">
                  {t('dbMonitor.connectionSummary')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-background rounded-lg border border-border p-4">
                    <div className="text-sm text-text-secondary font-poppins mb-1">
                      {t('dbMonitor.totalConnections')}
                    </div>
                    <div className="text-2xl font-orbitron text-text">{stats.dbProcesses.total}</div>
                  </div>
                  <div className="bg-background rounded-lg border border-border p-4">
                    <div className="text-sm text-text-secondary font-poppins mb-1">
                      {t('dbMonitor.userConnections')}
                    </div>
                    <div className="text-2xl font-orbitron text-text">{stats.dbProcesses.userConnections}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Process list */}
            <div className="bg-background-secondary rounded-lg border border-border p-6">
              <h2 className="text-2xl font-poppins font-semibold mb-4 text-text">
                {t('dbMonitor.processListTitle')}
              </h2>
              {stats?.dbProcesses?.processes && stats.dbProcesses.processes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-background border border-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-poppins font-semibold text-text">{t('dbMonitor.processId')}</th>
                        <th className="px-4 py-3 text-left font-poppins font-semibold text-text">{t('dbMonitor.user')}</th>
                        <th className="px-4 py-3 text-left font-poppins font-semibold text-text">{t('dbMonitor.host')}</th>
                        <th className="px-4 py-3 text-left font-poppins font-semibold text-text">{t('dbMonitor.db')}</th>
                        <th className="px-4 py-3 text-left font-poppins font-semibold text-text">{t('dbMonitor.command')}</th>
                        <th className="px-4 py-3 text-left font-poppins font-semibold text-text">{t('dbMonitor.time')}</th>
                        <th className="px-4 py-3 text-left font-poppins font-semibold text-text">{t('dbMonitor.state')}</th>
                        <th className="px-4 py-3 text-left font-poppins font-semibold text-text">{t('dbMonitor.info')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stats.dbProcesses.processes.map((proc) => (
                        <tr key={proc.id} className="hover:bg-background/60">
                          <td className="px-4 py-3 text-text-secondary font-poppins">{proc.id}</td>
                          <td className="px-4 py-3 text-text-secondary font-poppins">{proc.user}</td>
                          <td className="px-4 py-3 text-text-secondary font-poppins">{proc.host}</td>
                          <td className="px-4 py-3 text-text-secondary font-poppins">{proc.db || '-'}</td>
                          <td className="px-4 py-3 text-text-secondary font-poppins">{proc.command}</td>
                          <td className="px-4 py-3 text-text-secondary font-poppins">{formatDuration(proc.time)}</td>
                          <td className="px-4 py-3 text-text-secondary font-poppins">{proc.state || '-'}</td>
                          <td className="px-4 py-3 text-text-secondary font-poppins text-xs max-w-xs">
                            {proc.info ? (
                              <pre className="whitespace-pre-wrap break-words">{proc.info}</pre>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-text-secondary font-poppins text-sm">
                  {t('dbMonitor.noProcesses')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
