'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import ContactForm from '@/components/forms/ContactForm';

export default function TournamentsContent() {
  const t = useTranslations('Tournaments');
  const [showForm, setShowForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);

  const tournaments = [1, 2, 3, 4, 5, 6];

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 gradient-text text-center title-with-subscript">
          {t('title')}
        </h1>
        
        <h2 className="text-3xl md:text-4xl font-orbitron font-semibold mb-3 text-center text-text mt-8">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {tournaments.map((i) => (
                <div key={i} className="bg-background-secondary rounded-lg border border-gray-800 hover:border-primary transition-colors overflow-hidden">
                  <div className="relative h-48 w-full">
                    <Image
                      src={`/images/tournaments/tournament-${i}.jpg`}
                      alt={`${t('tournament', { defaultValue: 'Tournament' })} ${i}`}
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
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-orbitron font-semibold mb-3 text-text">
                      {t('tournament', { defaultValue: 'Tournament' })} {i}
                    </h3>
                    <p className="text-text-secondary font-poppins text-sm mb-4">
                      {t('date', { defaultValue: 'Date: Coming Soon' })}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedTournament(i);
                        setShowForm(true);
                      }}
                      className="w-full px-4 py-2 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      {t('cta')}
                    </button>
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
              ← {t('back', { defaultValue: 'Back to tournaments' })}
            </button>
            <div className="mb-6">
              <h3 className="text-2xl font-orbitron font-semibold mb-2 text-text">
                {t('registerFor', { defaultValue: 'Register for' })} {t('tournament', { defaultValue: 'Tournament' })} {selectedTournament}
              </h3>
            </div>
            <ContactForm email="event@padelo2.com" subject={`Tournament ${selectedTournament} Registration`} />
          </div>
        )}
      </div>
    </div>
  );
}

