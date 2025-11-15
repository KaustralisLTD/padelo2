'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import TournamentRegistrationForm from '@/components/forms/TournamentRegistrationForm';
import TournamentDetails from '@/components/TournamentDetails';

export default function TournamentsContent() {
  const t = useTranslations('Tournaments');
  const [showForm, setShowForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);

  const tournaments = [
    {
      id: 1,
      name: t('tournament1.name'),
      subtitle: t('tournament1.subtitle'),
      date: t('tournament1.date'),
      image: '/images/tournaments/tournament-1.png',
      isActive: true,
    },
    {
      id: 2,
      name: t('tournament2.name'),
      subtitle: t('tournament2.subtitle'),
      date: t('tournament2.date'),
      image: '/images/tournaments/tournament-1.png', // Используем существующее изображение
      isActive: false,
      verySoon: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text text-center title-with-subscript">
          {t('title')}
        </h1>
        
        <h2 className="text-3xl md:text-4xl font-poppins font-bold mb-3 text-center text-text mt-8">
          {t('headline')}
        </h2>
        
        <p className="text-xl text-text-secondary font-poppins text-center mb-12">
          {t('subhead')}
        </p>

        <div className="mb-12">
          <p className="text-text-secondary font-poppins text-lg leading-relaxed mb-8">
            {t('body')}
          </p>
        </div>

        {!showForm ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  onClick={() => {
                    if (tournament.isActive) {
                      setSelectedTournament(tournament.id);
                      setShowForm(true);
                    }
                  }}
                  className={`bg-background-secondary rounded-lg border border-border hover:border-primary transition-all overflow-hidden ${
                    tournament.isActive
                      ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]'
                      : 'cursor-not-allowed opacity-75'
                  }`}
                >
                  <div className="relative h-48 w-full">
                    <Image
                      src={tournament.image}
                      alt={tournament.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-background"><p class="text-text-secondary text-sm font-poppins">Tournament Image</p></div>';
                        }
                      }}
                    />
                    {tournament.verySoon && (
                      <div className="absolute top-4 right-4 bg-gradient-primary text-background px-4 py-2 rounded-lg font-orbitron font-bold text-sm">
                        {t('verySoon')}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-poppins font-bold mb-2 text-text">
                      {tournament.name}
                    </h3>
                    {tournament.subtitle && (
                      <p className="text-lg font-orbitron font-semibold mb-2 text-primary">
                        {tournament.subtitle}
                      </p>
                    )}
                    <p className="text-text-secondary font-poppins text-sm mb-4">
                      {tournament.date}
                    </p>
                    <div
                      className={`w-full px-4 py-2 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg text-center transition-opacity ${
                        tournament.isActive
                          ? 'hover:opacity-90'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {tournament.isActive ? t('cta') : t('comingSoon')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedTournament(null);
              }}
              className="mb-6 text-text-secondary hover:text-primary font-poppins transition-colors"
            >
              ← {t('back')}
            </button>
            <div className="mb-6">
              <h3 className="text-2xl font-poppins font-bold mb-2 text-text">
                {t('registerFor')} {tournaments.find(t => t.id === selectedTournament)?.name}
              </h3>
            </div>
            {selectedTournament && (
              <>
                <TournamentDetails tournamentId={selectedTournament} />
                <TournamentRegistrationForm
                  tournamentId={selectedTournament}
                  tournamentName={tournaments.find(t => t.id === selectedTournament)?.name || ''}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

