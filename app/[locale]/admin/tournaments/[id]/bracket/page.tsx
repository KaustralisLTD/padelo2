import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import TournamentBracket from '@/components/TournamentBracket';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Admin' });

  return generateSEOMetadata({
    title: t('tournaments.bracket') || 'Tournament Bracket',
    description: t('tournaments.bracketDescription') || 'Tournament bracket and schedule',
    keywords: ['tournament bracket', 'schedule'],
    path: `/admin/tournaments/${id}/bracket`,
    noindex: true,
    nofollow: true,
  }, locale);
}

export default async function AdminTournamentBracketPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const tournamentId = parseInt(id, 10);

  if (isNaN(tournamentId)) {
    return (
      <div>
        <p className="text-text-secondary font-poppins">Invalid tournament ID</p>
      </div>
    );
  }

  return <TournamentBracket tournamentId={tournamentId} />;
}

