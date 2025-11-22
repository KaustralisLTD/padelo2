import { getTranslations } from 'next-intl/server';
import ForgotPasswordContent from '@/components/pages/ForgotPasswordContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ForgotPassword' });
  
  return {
    title: t('title') || 'Forgot Password - PadelO₂',
    description: t('description') || 'Reset your password',
  };
}

export default async function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}

