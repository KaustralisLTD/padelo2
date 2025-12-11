import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import UnsubscribeContent from '@/components/pages/UnsubscribeContent';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Unsubscribe' });
  
  return generateSEOMetadata({
    title: t('title'),
    description: t('description'),
    keywords: ['unsubscribe', 'email preferences', 'padel unsubscribe'],
    path: '/unsubscribe',
  }, locale);
}

function UnsubscribeContentFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function UnsubscribePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<UnsubscribeContentFallback />}>
      <UnsubscribeContent />
    </Suspense>
  );
}

