'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminDashboardOnboarding from './AdminDashboardOnboarding';

type UserRole = 'superadmin' | 'staff' | 'participant';

export default function AdminDashboardContent() {
  const t = useTranslations('Dashboard');
  const tAdmin = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 0);
      return;
    }

    fetch('/api/auth/login', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem('auth_token');
          setTimeout(() => {
            router.push(`/${locale}/login`);
          }, 0);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        
        if (data.session) {
          setRole(data.session.role);
          setUser(data.session);
        } else {
          localStorage.removeItem('auth_token');
          setTimeout(() => {
            router.push(`/${locale}/login`);
          }, 0);
        }
      })
      .catch((error) => {
        console.error('Error verifying session:', error);
        localStorage.removeItem('auth_token');
        setTimeout(() => {
          router.push(`/${locale}/login`);
        }, 0);
      })
      .finally(() => setLoading(false));
  }, [locale, router]);

  useEffect(() => {
    // Check if this is first visit to admin dashboard
    if (!loading && user && role) {
      const hasVisited = localStorage.getItem('adminDashboardVisited');
      if (!hasVisited) {
        setShowOnboarding(true);
        localStorage.setItem('adminDashboardVisited', 'true');
      }
    }
  }, [loading, user, role]);

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-text-secondary font-poppins">{t('loading')}</p>
      </div>
    );
  }

  if (!user || !role) {
    return null;
  }

  // Render based on role
  if (role === 'superadmin') {
    return (
      <>
        {showOnboarding && <AdminDashboardOnboarding />}
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-poppins font-bold mb-2 gradient-text">
            {t('superadmin.title')}
          </h1>
          <p className="text-text-secondary font-poppins">
            {t('superadmin.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Link
            href={`/${locale}/admin/users`}
            className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-all group hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-center w-14 h-14 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-poppins font-semibold mb-2 text-text">
              {t('superadmin.manageUsers')}
            </h3>
            <p className="text-text-secondary font-poppins text-sm">
              {t('superadmin.manageUsersDesc')}
            </p>
          </Link>

          <Link
            href={`/${locale}/admin/tournaments`}
            className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-all group hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-center w-14 h-14 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-lg font-poppins font-semibold mb-2 text-text">
              {t('superadmin.manageTournaments')}
            </h3>
            <p className="text-text-secondary font-poppins text-sm">
              {t('superadmin.manageTournamentsDesc')}
            </p>
          </Link>

          <Link
            href={`/${locale}/admin/staff`}
            className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-all group hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-center w-14 h-14 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-poppins font-semibold mb-2 text-text">
              {t('superadmin.manageStaff')}
            </h3>
            <p className="text-text-secondary font-poppins text-sm">
              {t('superadmin.manageStaffDesc')}
            </p>
          </Link>

          <Link
            href={`/${locale}/admin/wallet`}
            className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-all group hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-center w-14 h-14 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-poppins font-semibold mb-2 text-text">
              {t('superadmin.wallet')}
            </h3>
            <p className="text-text-secondary font-poppins text-sm">
              {t('superadmin.walletDesc')}
            </p>
          </Link>

          <Link
            href={`/${locale}/admin/logs`}
            className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-all group hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-center w-14 h-14 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-poppins font-semibold mb-2 text-text">
              {t('superadmin.viewLogs')}
            </h3>
            <p className="text-text-secondary font-poppins text-sm">
              {t('superadmin.viewLogsDesc')}
            </p>
          </Link>

          <Link
            href={`/${locale}/admin/db-monitor`}
            className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-all group hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-center w-14 h-14 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h3 className="text-lg font-poppins font-semibold mb-2 text-text">
              {t('superadmin.dbMonitor')}
            </h3>
            <p className="text-text-secondary font-poppins text-sm">
              {t('superadmin.dbMonitorDesc')}
            </p>
          </Link>

          <Link
            href={`/${locale}/admin/partner-emails`}
            className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-all group hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-center w-14 h-14 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-poppins font-semibold mb-2 text-text">
              Emails
            </h3>
            <p className="text-text-secondary font-poppins text-sm">
              Send emails to partners, clients, coaches, and staff
            </p>
          </Link>

          <Link
            href={`/${locale}/admin/settings`}
            className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-all group hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-center w-14 h-14 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-poppins font-semibold mb-2 text-text">
              {tAdmin('settings.title')}
            </h3>
            <p className="text-text-secondary font-poppins text-sm">
              {tAdmin('settings.description')}
            </p>
          </Link>

          <Link
            href={`/${locale}/admin/messages`}
            className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-all group hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-center w-14 h-14 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-poppins font-semibold mb-2 text-text">
              {tAdmin('messages.title')}
            </h3>
            <p className="text-text-secondary font-poppins text-sm">
              {tAdmin('messages.description')}
            </p>
          </Link>
        </div>
        </div>
        </div>
      </>
    );
  }

  // Staff dashboard
  if (role === 'staff') {
    return (
      <>
        {showOnboarding && <AdminDashboardOnboarding />}
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-poppins font-bold mb-2 gradient-text">
            {t('staff.title')}
          </h1>
          <p className="text-text-secondary font-poppins">
            {t('staff.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href={`/${locale}/admin/tournaments`}
            className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-all group hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-center w-14 h-14 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-poppins font-semibold mb-2 text-text">
              {t('staff.manageRegistrations')}
            </h3>
            <p className="text-text-secondary font-poppins text-sm">
              {t('staff.manageRegistrationsDesc')}
            </p>
          </Link>

          <Link
            href={`/${locale}/admin/tournaments`}
            className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-all group hover:shadow-lg"
          >
            <div className="mb-4 flex items-center justify-center w-14 h-14 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-poppins font-semibold mb-2 text-text">
              {t('staff.editPlayers')}
            </h3>
            <p className="text-text-secondary font-poppins text-sm">
              {t('staff.editPlayersDesc')}
            </p>
          </Link>
        </div>
        </div>
        </div>
      </>
    );
  }

  return null;
}

