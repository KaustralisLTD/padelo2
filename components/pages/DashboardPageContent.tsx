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
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          setRole(data.session.role);
          setUser(data.session);
        } else {
          localStorage.removeItem('auth_token');
          router.push(`/${locale}/login`);
        }
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        router.push(`/${locale}/login`);
      })
      .finally(() => setLoading(false));
  }, [locale, router]);

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
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 gradient-text text-center">
            {t('superadmin.title')}
          </h1>
          <p className="text-xl text-text-secondary font-poppins text-center mb-12">
            {t('superadmin.description')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href={`/${locale}/admin/users`}
              className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors"
            >
              <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
                {t('superadmin.manageUsers')}
              </h3>
              <p className="text-text-secondary font-poppins text-sm">
                {t('superadmin.manageUsersDesc')}
              </p>
            </Link>

            <Link
              href={`/${locale}/admin/tournaments`}
              className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors"
            >
              <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
                {t('superadmin.manageTournaments')}
              </h3>
              <p className="text-text-secondary font-poppins text-sm">
                {t('superadmin.manageTournamentsDesc')}
              </p>
            </Link>

            <Link
              href={`/${locale}/admin/staff`}
              className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors"
            >
              <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
                {t('superadmin.manageStaff')}
              </h3>
              <p className="text-text-secondary font-poppins text-sm">
                {t('superadmin.manageStaffDesc')}
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
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 gradient-text text-center">
            {t('staff.title')}
          </h1>
          <p className="text-xl text-text-secondary font-poppins text-center mb-12">
            {t('staff.description')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href={`/${locale}/staff/registrations`}
              className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors"
            >
              <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
                {t('staff.manageRegistrations')}
              </h3>
              <p className="text-text-secondary font-poppins text-sm">
                {t('staff.manageRegistrationsDesc')}
              </p>
            </Link>

            <Link
              href={`/${locale}/staff/players`}
              className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors"
            >
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

  // Participant dashboard (existing tournament dashboard)
  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 gradient-text text-center">
          {t('participant.title')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins text-center mb-12">
          {t('participant.description')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href={`/${locale}/tournament/dashboard`}
            className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors"
          >
            <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
              {t('participant.myRegistration')}
            </h3>
            <p className="text-text-secondary font-poppins text-sm">
              {t('participant.myRegistrationDesc')}
            </p>
          </Link>

          <Link
            href={`/${locale}/participant/schedule`}
            className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors"
          >
            <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
              {t('participant.schedule')}
            </h3>
            <p className="text-text-secondary font-poppins text-sm">
              {t('participant.scheduleDesc')}
            </p>
          </Link>

          <Link
            href={`/${locale}/participant/results`}
            className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-colors"
          >
            <h3 className="text-xl font-orbitron font-semibold mb-2 text-text">
              {t('participant.results')}
            </h3>
            <p className="text-text-secondary font-poppins text-sm">
              {t('participant.resultsDesc')}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}


