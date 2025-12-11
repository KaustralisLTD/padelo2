import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import TournamentRulesEditor from '@/components/TournamentRulesEditor';

interface TournamentRulesPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function TournamentRulesPage({ params }: TournamentRulesPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Tournaments.rules' });
  const tournamentId = parseInt(id, 10);

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/${locale}/tournament/${tournamentId}/bracket`}
            className="text-text-secondary hover:text-primary font-poppins transition-colors"
          >
            ← {t('back')}
          </Link>
        </div>
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-8 gradient-text">
          {t('title')}
        </h1>

        <TournamentRulesEditor tournamentId={tournamentId} />
      </div>
    </div>
  );
}

