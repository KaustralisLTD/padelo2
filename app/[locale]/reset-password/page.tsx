import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import ResetPasswordContent from '@/components/pages/ResetPasswordContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ResetPassword' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-20 mt-20"><div className="max-w-md mx-auto text-center"><p className="text-text-secondary font-poppins">Loading...</p></div></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

