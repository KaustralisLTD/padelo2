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
  return <ResetPasswordContent />;
}

