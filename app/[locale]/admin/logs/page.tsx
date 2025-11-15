import { getTranslations } from 'next-intl/server';
import AdminLogsContent from '@/components/pages/AdminLogsContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return {
    title: `${t('logs.title')} | PadelO₂`,
    description: t('logs.description'),
  };
}

export default function AdminLogsPage() {
  return <AdminLogsContent />;
}

