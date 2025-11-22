'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface TournamentRulesEditorProps {
  tournamentId: number;
}

export default function TournamentRulesEditor({ tournamentId }: TournamentRulesEditorProps) {
  const t = useTranslations('Tournaments.rules');
  const [rules, setRules] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsAdmin(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.session && data.session.role === 'superadmin') {
        setIsAdmin(true);
      }
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const fetchRules = async () => {
    try {
      const response = await fetch(`/api/tournament/${tournamentId}/rules`);
      const data = await response.json();
      if (data.rules) {
        setRules(data.rules);
        setFormData(data.rules);
      } else {
        // Используем дефолтные правила из локализации
        setRules(null);
        setFormData({
          payment: { text: t('payment.text') },
          gameRules: {
            winner: t('gameRules.winner'),
            tieBreak: t('gameRules.tieBreak'),
            timeLimit: t('gameRules.timeLimit'),
            semifinals: t('gameRules.semifinals'),
          },
          warmup: { text: t('warmup.text') },
          results: { text: t('results.text') },
          points: {
            win: t('points.win'),
            loss: t('points.loss'),
            tiebreaker: t('points.tiebreaker'),
          },
          qualification: { text: t('qualification.text') },
          otherRules: {
            exterior: t('otherRules.exterior'),
            disputed: t('otherRules.disputed'),
            balls: t('otherRules.balls'),
            partner: t('otherRules.partner'),
            media: t('otherRules.media'),
          },
        });
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/tournament/${tournamentId}/rules`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rules: formData }),
      });

      if (response.ok) {
        setRules(formData);
        setEditMode(false);
        alert(t('rulesSaved'));
      } else {
        alert(t('errorSaving'));
      }
    } catch (error) {
      console.error('Error saving rules:', error);
      alert(t('errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-text-secondary font-poppins">{t('loading')}</div>;
  }

  const displayRules = rules || formData;

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end mb-4">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity font-poppins"
            >
              {t('editRules')}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity font-poppins disabled:opacity-50"
              >
                {saving ? t('saving') : t('save')}
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setFormData(displayRules);
                }}
                className="px-4 py-2 bg-background-secondary text-text border border-border rounded-lg hover:border-primary transition-colors font-poppins"
              >
                {t('cancel')}
              </button>
            </div>
          )}
        </div>
      )}

      {editMode ? (
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-poppins font-bold mb-4 text-text">
              {t('payment.title')}
            </h2>
            <textarea
              value={formData.payment?.text || ''}
              onChange={(e) => setFormData({ ...formData, payment: { text: e.target.value } })}
              className="w-full p-3 bg-background border border-border rounded-lg text-text-secondary font-poppins"
              rows={3}
            />
          </section>

          <section>
            <h2 className="text-2xl font-poppins font-bold mb-4 text-text">
              {t('gameRules.title')}
            </h2>
            <div className="space-y-4">
              <textarea
                value={formData.gameRules?.winner || ''}
                onChange={(e) => setFormData({ ...formData, gameRules: { ...formData.gameRules, winner: e.target.value } })}
                className="w-full p-3 bg-background border border-border rounded-lg text-text-secondary font-poppins"
                rows={2}
                placeholder={t('gameRules.winner')}
              />
              <textarea
                value={formData.gameRules?.tieBreak || ''}
                onChange={(e) => setFormData({ ...formData, gameRules: { ...formData.gameRules, tieBreak: e.target.value } })}
                className="w-full p-3 bg-background border border-border rounded-lg text-text-secondary font-poppins"
                rows={2}
                placeholder={t('gameRules.tieBreak')}
              />
              <textarea
                value={formData.gameRules?.timeLimit || ''}
                onChange={(e) => setFormData({ ...formData, gameRules: { ...formData.gameRules, timeLimit: e.target.value } })}
                className="w-full p-3 bg-background border border-border rounded-lg text-text-secondary font-poppins"
                rows={2}
                placeholder={t('gameRules.timeLimit')}
              />
              <textarea
                value={formData.gameRules?.semifinals || ''}
                onChange={(e) => setFormData({ ...formData, gameRules: { ...formData.gameRules, semifinals: e.target.value } })}
                className="w-full p-3 bg-background border border-border rounded-lg text-text-secondary font-poppins"
                rows={2}
                placeholder={t('gameRules.semifinals')}
              />
            </div>
          </section>

          {/* Добавить остальные секции аналогично */}
        </div>
      ) : (
        <div className="bg-background-secondary rounded-lg border border-border p-6 space-y-6">
          <section>
            <h2 className="text-2xl font-poppins font-bold mb-4 text-text">
              {t('payment.title')}
            </h2>
            <p className="text-text-secondary font-poppins whitespace-pre-line">
              {displayRules.payment?.text || t('payment.text')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-poppins font-bold mb-4 text-text">
              {t('gameRules.title')}
            </h2>
            <div className="text-text-secondary font-poppins whitespace-pre-line space-y-4">
              <p>{displayRules.gameRules?.winner || t('gameRules.winner')}</p>
              <p>{displayRules.gameRules?.tieBreak || t('gameRules.tieBreak')}</p>
              <p>{displayRules.gameRules?.timeLimit || t('gameRules.timeLimit')}</p>
              <p>{displayRules.gameRules?.semifinals || t('gameRules.semifinals')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-poppins font-bold mb-4 text-text">
              {t('warmup.title')}
            </h2>
            <p className="text-text-secondary font-poppins whitespace-pre-line">
              {displayRules.warmup?.text || t('warmup.text')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-poppins font-bold mb-4 text-text">
              {t('results.title')}
            </h2>
            <p className="text-text-secondary font-poppins whitespace-pre-line">
              {displayRules.results?.text || t('results.text')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-poppins font-bold mb-4 text-text">
              {t('points.title')}
            </h2>
            <div className="text-text-secondary font-poppins space-y-2">
              <p>{displayRules.points?.win || t('points.win')}</p>
              <p>{displayRules.points?.loss || t('points.loss')}</p>
              <p>{displayRules.points?.tiebreaker || t('points.tiebreaker')}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-poppins font-bold mb-4 text-text">
              {t('qualification.title')}
            </h2>
            <p className="text-text-secondary font-poppins whitespace-pre-line">
              {displayRules.qualification?.text || t('qualification.text')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-poppins font-bold mb-4 text-text">
              {t('otherRules.title')}
            </h2>
            <div className="text-text-secondary font-poppins space-y-2 whitespace-pre-line">
              <p>{displayRules.otherRules?.exterior || t('otherRules.exterior')}</p>
              <p>{displayRules.otherRules?.disputed || t('otherRules.disputed')}</p>
              <p>{displayRules.otherRules?.balls || t('otherRules.balls')}</p>
              <p>{displayRules.otherRules?.partner || t('otherRules.partner')}</p>
              <p>{displayRules.otherRules?.media || t('otherRules.media')}</p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

