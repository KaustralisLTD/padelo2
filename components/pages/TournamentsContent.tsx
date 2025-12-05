'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
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
  const locale = useLocale();
  const [showForm, setShowForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const hashHandledRef = useRef(false);
  const [registrationType, setRegistrationType] = useState<'participant' | 'guest'>('participant');
  const [selectedTournamentData, setSelectedTournamentData] = useState<any>(null);

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
          // Сортируем: сначала 'open', потом 'soon'
          const sortedTournaments = publicTournaments.sort((a: Tournament, b: Tournament) => {
            if (a.status === 'open' && b.status === 'soon') return -1;
            if (a.status === 'soon' && b.status === 'open') return 1;
            return 0;
          });
          setTournaments(sortedTournaments);
        }
      } catch (error) {
        console.error('Failed to fetch tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  // Загружаем данные турнира при выборе
  useEffect(() => {
    if (!selectedTournament) {
      setSelectedTournamentData(null);
      return;
    }

    const fetchTournamentData = async () => {
      try {
        const response = await fetch(`/api/tournament/${selectedTournament}`);
        if (response.ok) {
          const data = await response.json();
          setSelectedTournamentData(data.tournament);
          // Если гостевой билет включен, по умолчанию выбираем участника
          if (data.tournament?.guestTicket?.enabled) {
            setRegistrationType('participant');
          }
        }
      } catch (error) {
        console.error('Failed to fetch tournament data:', error);
      }
    };

    fetchTournamentData();
  }, [selectedTournament]);

  useEffect(() => {
    if (loading || hashHandledRef.current) {
      return;
    }
    if (typeof window === 'undefined') return;
    
    // Проверяем query параметр _redirectHash (устанавливается middleware при редиректе)
    const urlParams = new URLSearchParams(window.location.search);
    const redirectHash = urlParams.get('_redirectHash');
    if (redirectHash) {
      // Устанавливаем правильный hash и удаляем query параметр
      const newHash = '#' + redirectHash;
      const newUrl = window.location.pathname + newHash;
      window.history.replaceState(null, '', newUrl);
      urlParams.delete('_redirectHash');
      if (urlParams.toString()) {
        window.history.replaceState(null, '', newUrl + '?' + urlParams.toString());
      } else {
        window.history.replaceState(null, '', newUrl);
      }
    }
    
    let { hash } = window.location;
    
    // Декодируем %23 обратно в #, если браузер закодировал якорь
    if (hash && hash.includes('%23')) {
      hash = decodeURIComponent(hash);
      // Обновляем URL без кодирования якоря
      window.history.replaceState(null, '', window.location.pathname + window.location.search + hash);
    }
    
    // Если hash был установлен через redirectHash, используем его
    if (redirectHash && !hash) {
      hash = '#' + redirectHash;
    }
    
    if (!hash) {
      hashHandledRef.current = true;
      return;
    }
    const registerMatch = hash.match(/^#register-(\d+)$/i);
    const cardMatch = hash.match(/^#tournament-(\d+)$/i);
    const targetId = registerMatch
      ? Number(registerMatch[1])
      : cardMatch
        ? Number(cardMatch[1])
        : null;

    if (targetId && tournaments.some((t) => t.id === targetId)) {
      if (registerMatch) {
        setSelectedTournament(targetId);
        setShowForm(true);
        setTimeout(() => {
          const element = document.getElementById(`register-${targetId}`);
          if (element) {
            const headerHeight = 100; // Высота хедера с отступом
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerHeight;
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }, 100);
      } else if (cardMatch) {
        setTimeout(() => {
          const element = document.getElementById(`tournament-${targetId}`);
          if (element) {
            const headerHeight = 100;
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerHeight;
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }, 0);
      }
    }
    hashHandledRef.current = true;
  }, [loading, tournaments]);

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
                      id={`tournament-${tournament.id}`}
                      key={tournament.id}
                      onClick={() => {
                        if (isActive) {
                          setSelectedTournament(tournament.id);
                          setShowForm(true);
                          if (typeof window !== 'undefined') {
                            window.history.replaceState(null, '', `#register-${tournament.id}`);
                          }
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
                          <Image
                            src={tournament.bannerImageData}
                            alt={tournament.name}
                            fill
                            className="object-cover"
                            unoptimized
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
                if (typeof window !== 'undefined') {
                  window.history.replaceState(null, '', window.location.pathname + window.location.search);
                }
              }}
              className="mb-6 text-text-secondary hover:text-primary font-poppins transition-colors"
            >
              ← {t('back')}
            </button>
            <div className="mb-6">
              <h3
                id={selectedTournament ? `register-${selectedTournament}` : undefined}
                className="text-2xl font-poppins font-bold mb-4 text-text"
              >
                {t('registerFor')} {tournaments.find(t => t.id === selectedTournament)?.name || ''}
              </h3>
              
              {/* Registration Type Selection - только если гостевой билет включен */}
              {selectedTournamentData?.guestTicket?.enabled && (
                <div className="mb-6 p-4 bg-background-secondary border border-border rounded-lg max-w-4xl">
                  <label className="block text-sm font-poppins font-semibold text-text mb-4">
                    {t('form.registrationType') || 'Registration Type'} *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      registrationType === 'participant'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}>
                      <input
                        type="radio"
                        name="registrationType"
                        value="participant"
                        checked={registrationType === 'participant'}
                        onChange={(e) => setRegistrationType(e.target.value as 'participant' | 'guest')}
                        className="w-5 h-5 text-primary mr-3"
                      />
                      <div>
                        <div className="font-poppins font-semibold text-text">
                          {t('form.registerAsParticipant') || 'Register as Participant'}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {t('form.registerAsParticipantDesc') || 'Participate in tournament categories'}
                        </div>
                      </div>
                    </label>
                    <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      registrationType === 'guest'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}>
                      <input
                        type="radio"
                        name="registrationType"
                        value="guest"
                        checked={registrationType === 'guest'}
                        onChange={(e) => setRegistrationType(e.target.value as 'participant' | 'guest')}
                        className="w-5 h-5 text-primary mr-3"
                      />
                      <div>
                        <div className="font-poppins font-semibold text-text">
                          {(() => {
                            // Используем переведенный title гостевого билета
                            let guestTitle = selectedTournamentData.guestTicket.title || t('form.registerAsGuest') || 'Register as Guest';
                            if (selectedTournamentData.translations?.guestTicketTitle) {
                              let keysToTry: string[] = [locale];
                              if (locale === 'ua') { keysToTry = ['ua', 'uk', 'ru', 'en']; }
                              else if (locale === 'uk') { keysToTry = ['uk', 'ua', 'ru', 'en']; }
                              else { keysToTry = [locale, 'en']; }
                              for (const key of keysToTry) {
                                if (selectedTournamentData.translations.guestTicketTitle[key]) {
                                  guestTitle = selectedTournamentData.translations.guestTicketTitle[key];
                                  break;
                                }
                              }
                            }
                            return guestTitle;
                          })()}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {(() => {
                            let guestDescription = selectedTournamentData.guestTicket.description || 'Attend as a guest';
                            if (selectedTournamentData.translations?.guestTicketDescription) {
                              let keysToTry: string[] = [locale];
                              if (locale === 'ua') { keysToTry = ['ua', 'uk', 'ru', 'en']; }
                              else if (locale === 'uk') { keysToTry = ['uk', 'ua', 'ru', 'en']; }
                              else { keysToTry = [locale, 'en']; }
                              for (const key of keysToTry) {
                                if (selectedTournamentData.translations.guestTicketDescription[key]) {
                                  guestDescription = selectedTournamentData.translations.guestTicketDescription[key];
                                  break;
                                }
                              }
                            }
                            const guestPrice = selectedTournamentData.guestTicket.price;
                            return guestPrice 
                              ? `${guestPrice} EUR - ${guestDescription}`
                              : guestDescription;
                          })()}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
            {selectedTournament && (
              <>
                <TournamentDetails tournamentId={selectedTournament} registrationType={registrationType} />
                <TournamentRegistrationForm
                  tournamentId={selectedTournament}
                  tournamentName={tournaments.find(t => t.id === selectedTournament)?.name || ''}
                  registrationType={registrationType}
                  tournamentData={selectedTournamentData}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

