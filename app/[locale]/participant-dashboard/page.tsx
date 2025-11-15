import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ParticipantDashboardContent } from '@/components/pages/ParticipantDashboardContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ParticipantDashboard' });

  return {
    title: t('title') + ' | PadelO₂',
    description: t('description'),
  };
}

export default async function ParticipantDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ParticipantDashboardContent />;
}

