'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type UserRole = 'superadmin' | 'staff' | 'participant';

export default function DashboardPageContent() {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    // Verify token and get user info
    fetch('/api/auth/login', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          // If response is not OK, remove token and redirect
          localStorage.removeItem('auth_token');
          router.push(`/${locale}/login`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return; // Already handled error case
        
        if (data.session) {
          setRole(data.session.role);
          setUser(data.session);
        } else {
          localStorage.removeItem('auth_token');
          router.push(`/${locale}/login`);
        }
      })
      .catch((error) => {
        console.error('Error verifying session:', error);
        localStorage.removeItem('auth_token');
        router.push(`/${locale}/login`);
      })
      .finally(() => setLoading(false));
  }, [locale, router]);

  useEffect(() => {
    if (!loading && role === 'participant') {
      router.push(`/${locale}/participant-dashboard`);
    }
  }, [loading, role, locale, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-text-secondary font-poppins">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user || !role) {
    return null;
  }

  // Render based on role
  if (role === 'superadmin') {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text text-center">
            {t('superadmin.title')}
          </h1>
          <p className="text-xl text-text-secondary font-poppins text-center mb-12">
            {t('superadmin.description')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <Link
              href={`/${locale}/admin/users`}
              className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors group"
            >
              <div className="mb-4 flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
                {t('superadmin.manageUsers')}
              </h3>
              <p className="text-text-secondary font-poppins text-sm">
                {t('superadmin.manageUsersDesc')}
              </p>
            </Link>

            <Link
              href={`/${locale}/admin/tournaments`}
              className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors group"
            >
              <div className="mb-4 flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors relative">
                {/* Кубки 1-2-3 места - пьедестал */}
                <div className="flex items-end gap-0.5">
                  {/* 2 место - серебро */}
                  <div className="flex flex-col items-center">
                    <svg className="w-4 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L14 7H20L16 10L17 15L12 13L7 15L8 10L4 7H10L12 2Z" />
                    </svg>
                    <div className="w-3 h-1 bg-gray-400 rounded-t"></div>
                  </div>
                  {/* 1 место - золото */}
                  <div className="flex flex-col items-center">
                    <svg className="w-6 h-7 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L15 8H22L17 12L19 18L12 15L5 18L7 12L2 8H9L12 2Z" />
                    </svg>
                    <div className="w-4 h-1.5 bg-yellow-400 rounded-t"></div>
                  </div>
                  {/* 3 место - бронза */}
                  <div className="flex flex-col items-center">
                    <svg className="w-3.5 h-4.5 text-amber-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L13 6H18L15 9L16 13L12 11L8 13L9 9L6 6H11L12 2Z" />
                    </svg>
                    <div className="w-2.5 h-0.5 bg-amber-700 rounded-t"></div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
                {t('superadmin.manageTournaments')}
              </h3>
              <p className="text-text-secondary font-poppins text-sm">
                {t('superadmin.manageTournamentsDesc')}
              </p>
            </Link>

            <Link
              href={`/${locale}/admin/staff`}
              className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors group"
            >
              <div className="mb-4 flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
                {t('superadmin.manageStaff')}
              </h3>
              <p className="text-text-secondary font-poppins text-sm">
                {t('superadmin.manageStaffDesc')}
              </p>
            </Link>

            <Link
              href={`/${locale}/admin/logs`}
              className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors group"
            >
              <div className="mb-4 flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
                {t('superadmin.viewLogs')}
              </h3>
              <p className="text-text-secondary font-poppins text-sm">
                {t('superadmin.viewLogsDesc')}
              </p>
            </Link>

            <Link
              href={`/${locale}/admin/db-monitor`}
              className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors group"
            >
              <div className="mb-4 flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
                {t('superadmin.dbMonitor')}
              </h3>
              <p className="text-text-secondary font-poppins text-sm">
                {t('superadmin.dbMonitorDesc')}
              </p>
            </Link>

            <Link
              href={`/${locale}/admin/wallet`}
              className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors group"
            >
              <div className="mb-4 flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
                {t('superadmin.wallet')}
              </h3>
              <p className="text-text-secondary font-poppins text-sm">
                {t('superadmin.walletDesc')}
              </p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'staff') {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text text-center">
            {t('staff.title')}
          </h1>
          <p className="text-xl text-text-secondary font-poppins text-center mb-12">
            {t('staff.description')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href={`/${locale}/staff/registrations`}
              className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors group"
            >
              <div className="mb-4 flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
                {t('staff.manageRegistrations')}
              </h3>
              <p className="text-text-secondary font-poppins text-sm">
                {t('staff.manageRegistrationsDesc')}
              </p>
            </Link>

            <Link
              href={`/${locale}/staff/players`}
              className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors group"
            >
              <div className="mb-4 flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
                {t('staff.editPlayers')}
              </h3>
              <p className="text-text-secondary font-poppins text-sm">
                {t('staff.editPlayersDesc')}
              </p>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (role === 'participant') {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary font-poppins">{t('loading')}</p>
        </div>
      </div>
    );
  }
  
  return null;
}


