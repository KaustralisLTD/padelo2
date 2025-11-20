'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import TournamentRegistrationForm from '@/components/forms/TournamentRegistrationForm';
import TournamentDetails from '@/components/TournamentDetails';

interface Tournament {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'open' | 'closed' | 'in_progress' | 'completed' | 'demo' | 'archived' | 'soon';
  bannerImageName?: string | null;
  bannerImageData?: string | null;
}

export default function TournamentsContent() {
  const t = useTranslations('Tournaments');
  const [showForm, setShowForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const response = await fetch('/api/tournaments/public');
        if (response.ok) {
          const data = await response.json();
          // Фильтруем только турниры со статусами 'open' и 'soon'
          const publicTournaments = (data.tournaments || []).filter(
            (t: Tournament) => t.status === 'open' || t.status === 'soon'
          );
          setTournaments(publicTournaments);
        }
      } catch (error) {
        console.error('Failed to fetch tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

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
            {loading ? (
              <div className="text-center py-12">
                <p className="text-text-secondary font-poppins">{t('loading') || 'Loading...'}</p>
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-secondary font-poppins">{t('noTournaments') || 'No tournaments available'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {tournaments.map((tournament) => {
                  const isActive = tournament.status === 'open';
                  const isSoon = tournament.status === 'soon';
                  const formatDate = (dateString: string) => {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                  };

                  return (
                    <div
                      key={tournament.id}
                      onClick={() => {
                        if (isActive) {
                          setSelectedTournament(tournament.id);
                          setShowForm(true);
                        }
                      }}
                      className={`bg-background-secondary rounded-lg border border-border hover:border-primary transition-all overflow-hidden ${
                        isActive
                          ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]'
                          : 'cursor-not-allowed opacity-75'
                      }`}
                    >
                      <div className="relative h-48 w-full">
                        {tournament.bannerImageData ? (
                          <img
                            src={tournament.bannerImageData}
                            alt={tournament.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-background">
                            <p className="text-text-secondary text-sm font-poppins">Tournament Image</p>
                          </div>
                        )}
                        {isSoon && (
                          <div className="absolute top-4 right-4 bg-gradient-primary text-background px-4 py-2 rounded-lg font-orbitron font-bold text-sm">
                            {t('verySoon')}
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-poppins font-bold mb-2 text-text">
                          {tournament.name}
                        </h3>
                        <p className="text-text-secondary font-poppins text-sm mb-4">
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </p>
                        <div
                          className={`w-full px-4 py-2 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg text-center transition-opacity ${
                            isActive
                              ? 'hover:opacity-90'
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {isActive ? t('cta') : t('comingSoon')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                {t('registerFor')} {tournaments.find(t => t.id === selectedTournament)?.name || ''}
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

