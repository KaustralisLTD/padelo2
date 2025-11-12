'use client';

import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminStaffContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
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
        }
      })
      .catch(() => {
        router.push(`/${locale}/login`);
      });
  }, [locale, router]);

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/${locale}/dashboard`}
            className="text-text-secondary hover:text-primary font-poppins transition-colors"
          >
            ← {t('backToDashboard')}
          </Link>
        </div>
        <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 gradient-text">
          {t('staff.title')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins mb-12">
          {t('staff.description')}
        </p>

        <div className="bg-background-secondary p-6 rounded-lg border border-border">
          <p className="text-text-secondary font-poppins">
            {t('staff.comingSoon')}
          </p>
        </div>
      </div>
    </div>
  );
}


