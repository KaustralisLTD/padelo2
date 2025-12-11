import TournamentBracket from '@/components/TournamentBracket';

interface TournamentBracketPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function TournamentBracketPage({ params }: TournamentBracketPageProps) {
  const { id } = await params;
  const tournamentId = parseInt(id, 10);

  if (isNaN(tournamentId)) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-6xl mx-auto">
          <p className="text-text-secondary font-poppins">Invalid tournament ID</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-6xl mx-auto">
        <TournamentBracket tournamentId={tournamentId} />
      </div>
    </div>
  );
}

