import { getTranslations } from 'next-intl/server';
import AdminDbMonitorContent from '@/components/pages/AdminDbMonitorContent';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return {
    title: `${t('dbMonitor.title')} | PadelO₂`,
    description: t('dbMonitor.description'),
  };
}

export default function AdminDbMonitorPage() {
  return <AdminDbMonitorContent />;
}
