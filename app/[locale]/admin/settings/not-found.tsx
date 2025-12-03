import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function SettingsNotFound({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('NotFound');
  const tAdmin = await getTranslations({ locale, namespace: 'Admin' });
  
  return (
    <div className="w-full px-4 py-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-8">
          <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-6xl font-orbitron font-bold mb-4 gradient-text">404</h1>
        <h2 className="text-2xl font-orbitron font-semibold mb-6 text-text">
          {t('title')}
        </h2>
        <p className="text-text-secondary font-poppins mb-8 text-lg">
          {t('description')}
        </p>
        
        <div className="bg-background-secondary rounded-lg border border-border p-8 mb-8">
          <Link
            href={`/${locale}/admin/settings`}
            className="inline-block px-8 py-3 bg-gradient-primary text-background font-poppins font-semibold rounded-lg hover:opacity-90 transition-opacity mb-4"
          >
            {tAdmin('settings.title') || 'Back to Settings'}
          </Link>
        </div>

        <Link
          href={`/${locale}/admin/dashboard`}
          className="inline-block px-8 py-3 bg-background-secondary border border-border text-text font-poppins font-semibold rounded-lg hover:border-primary transition-colors"
        >
          {tAdmin('dashboard.title') || 'Back to Dashboard'}
        </Link>
      </div>
    </div>
  );
}

