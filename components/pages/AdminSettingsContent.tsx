'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function AdminSettingsContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();

  const settingsCategories = [
    {
      title: t('settings.clubModules.title') || 'Club Modules',
      description: t('settings.clubModules.description') || 'Manage your club related settings',
      modules: [
        {
          title: t('settings.clubModules.courts.title') || 'Courts',
          description: t('settings.clubModules.courts.description') || 'Add, edit or manage all your courts from here.',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
          href: `/${locale}/admin/settings/courts`,
        },
        {
          title: t('settings.clubModules.extras.title') || 'Extras',
          description: t('settings.clubModules.extras.description') || 'Add, edit or manage products that will be available at your facility.',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          ),
          href: `/${locale}/admin/settings/extras`,
        },
        {
          title: t('settings.clubModules.pricing.title') || 'Pricing',
          description: t('settings.clubModules.pricing.description') || 'Configure your court\'s price based on time and date.',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          ),
          href: `/${locale}/admin/settings/pricing`,
        },
        {
          title: t('settings.clubModules.holidays.title') || 'Holidays',
          description: t('settings.clubModules.holidays.description') || 'Add, edit or manage holidays that will apply your facility.',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
          href: `/${locale}/admin/settings/holidays`,
        },
        {
          title: t('settings.clubModules.policies.title') || 'Policies',
          description: t('settings.clubModules.policies.description') || 'Add, edit or manage all your club policies.',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          href: `/${locale}/admin/settings/policies`,
        },
      ],
    },
    {
      title: t('settings.companyAdmin.title') || 'Company Admin Modules',
      description: t('settings.companyAdmin.description') || 'Configure your company related settings',
      modules: [
        {
          title: t('settings.companyAdmin.company.title') || 'Company',
          description: t('settings.companyAdmin.company.description') || 'Edit or update your company information here.',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
          href: `/${locale}/admin/settings/company`,
        },
        {
          title: t('settings.companyAdmin.clubs.title') || 'Clubs',
          description: t('settings.companyAdmin.clubs.description') || 'Add, edit or manage multiple clubs. Add locations, facilities and sports categories.',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          ),
          href: `/${locale}/admin/settings/clubs`,
        },
        {
          title: t('settings.companyAdmin.manageAdmins.title') || 'Manage Admins',
          description: t('settings.companyAdmin.manageAdmins.description') || 'Add, edit and manage clubs admins and their permissions.',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
          href: `/${locale}/admin/settings/admins`,
        },
        {
          title: t('settings.companyAdmin.terms.title') || 'Terms and Conditions',
          description: t('settings.companyAdmin.terms.description') || 'Update your company terms and conditions.',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          href: `/${locale}/admin/settings/terms`,
        },
      ],
    },
    {
      title: t('settings.account.title') || 'Account',
      description: t('settings.account.description') || 'Manage your account settings',
      modules: [
        {
          title: t('settings.account.profile.title') || 'Profile',
          description: t('settings.account.profile.description') || 'Update your profile information.',
          icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          href: `/${locale}/profile`,
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 pt-20 pl-4">
      <div>
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text">
          {t('settings.title')}
        </h1>
        <p className="text-xl text-text-secondary font-poppins">
          {t('settings.description') || 'Manage your system settings and configurations'}
        </p>
      </div>

      {settingsCategories.map((category, categoryIndex) => (
        <div key={categoryIndex} className="space-y-4">
          <div>
            <h2 className="text-2xl font-poppins font-semibold text-text mb-2">
              {category.title}
            </h2>
            <p className="text-text-secondary font-poppins text-sm">
              {category.description}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.modules.map((module, moduleIndex) => (
              <Link
                key={moduleIndex}
                href={module.href}
                className="bg-background-secondary p-6 rounded-lg border border-border hover:border-primary transition-all group hover:shadow-lg"
              >
                <div className="mb-4 flex items-center justify-center w-14 h-14 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <div className="text-primary">
                    {module.icon}
                  </div>
                </div>
                <h3 className="text-lg font-poppins font-semibold mb-2 text-text">
                  {module.title}
                </h3>
                <p className="text-text-secondary font-poppins text-sm">
                  {module.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

