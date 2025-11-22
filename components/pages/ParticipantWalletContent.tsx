'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Wallet {
  balance: number;
  currency: string;
}

interface Transaction {
  id: number;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund';
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
  status: 'completed' | 'pending' | 'failed';
}

export function ParticipantWalletContent() {
  const t = useTranslations('ParticipantWallet');
  const locale = useLocale();
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    Promise.all([
      fetch('/api/user/wallet', {
        headers: { 'Authorization': `Bearer ${token}` },
      }),
      fetch('/api/user/wallet/transactions', {
        headers: { 'Authorization': `Bearer ${token}` },
      }),
    ])
      .then(async ([walletRes, transactionsRes]) => {
        if (!walletRes.ok) {
          const errorData = await walletRes.json().catch(() => ({}));
          throw new Error(errorData.error || t('errorLoadingWallet'));
        }
        
        if (!transactionsRes.ok) {
          const errorData = await transactionsRes.json().catch(() => ({}));
          console.error('Error fetching transactions:', errorData.error);
        }
        
        const walletData = await walletRes.json();
        const transactionsData = await transactionsRes.json();
        
        if (walletData.error) {
          setError(walletData.error);
        } else {
          setWallet(walletData.wallet || { balance: 0, currency: 'EUR' });
        }
        
        if (transactionsData.error) {
          console.error('Error fetching transactions:', transactionsData.error);
        } else {
          setTransactions(transactionsData.transactions || []);
        }
      })
      .catch((err) => {
        console.error('Error fetching wallet data:', err);
        setError(err.message || t('errorLoadingWallet'));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary font-poppins">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl md:text-5xl font-poppins font-bold gradient-text">
            {t('title')}
          </h1>
          <Link
            href={`/${locale}/dashboard`}
            className="px-6 py-3 bg-background-secondary border border-border text-text font-orbitron font-semibold rounded-lg hover:border-primary transition-colors"
          >
            {t('backToDashboard')}
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 mb-6 text-center">
            <p className="text-red-400 font-poppins mb-4">{t('error') || 'Something went wrong!'}</p>
            <p className="text-red-300 font-poppins text-sm mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                const token = localStorage.getItem('auth_token');
                if (token) {
                  Promise.all([
                    fetch('/api/user/wallet', {
                      headers: { 'Authorization': `Bearer ${token}` },
                    }),
                    fetch('/api/user/wallet/transactions', {
                      headers: { 'Authorization': `Bearer ${token}` },
                    }),
                  ])
                    .then(async ([walletRes, transactionsRes]) => {
                      if (!walletRes.ok) {
                        const errorData = await walletRes.json().catch(() => ({}));
                        throw new Error(errorData.error || t('errorLoadingWallet'));
                      }
                      const walletData = await walletRes.json();
                      const transactionsData = await transactionsRes.json();
                      if (walletData.error) {
                        setError(walletData.error);
                      } else {
                        setWallet(walletData.wallet || { balance: 0, currency: 'EUR' });
                      }
                      if (transactionsData.error) {
                        console.error('Error fetching transactions:', transactionsData.error);
                      } else {
                        setTransactions(transactionsData.transactions || []);
                      }
                    })
                    .catch((err) => {
                      setError(err.message || t('errorLoadingWallet'));
                    })
                    .finally(() => setLoading(false));
                }
              }}
              className="px-6 py-3 bg-primary text-background font-orbitron font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('tryAgain') || 'Try again'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-background-secondary p-8 rounded-lg border border-border">
            <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
              {t('balance')}
            </h2>
            <div className="text-4xl font-bold text-primary mb-2">
              {typeof wallet?.balance === 'number' ? wallet.balance.toFixed(2) : parseFloat(String(wallet?.balance || 0)).toFixed(2)} {wallet?.currency || 'EUR'}
            </div>
            <p className="text-text-secondary font-poppins text-sm">
              {t('balanceDescription')}
            </p>
          </div>

          <div className="bg-background-secondary p-8 rounded-lg border border-border">
            <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
              {t('topUp')}
            </h2>
            <p className="text-text-secondary font-poppins text-sm mb-4">
              {t('topUpDescription')}
            </p>
            <button
              disabled
              className="w-full px-6 py-3 bg-gradient-primary text-background font-orbitron font-semibold rounded-lg opacity-50 cursor-not-allowed"
            >
              {t('comingSoon')}
            </button>
          </div>
        </div>

        <div className="bg-background-secondary p-6 rounded-lg border border-border">
          <h2 className="text-xl font-orbitron font-semibold mb-4 text-text">
            {t('transactions')}
          </h2>
          {transactions.length === 0 ? (
            <p className="text-text-secondary font-poppins text-center py-8">
              {t('noTransactions')}
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-poppins rounded ${
                        transaction.type === 'deposit' || transaction.type === 'refund' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {t(`types.${transaction.type}`)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-poppins rounded ${
                        transaction.status === 'completed' 
                          ? 'bg-green-500/20 text-green-400' 
                          : transaction.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {t(`status.${transaction.status}`)}
                      </span>
                    </div>
                    <p className="text-text font-poppins text-sm">{transaction.description}</p>
                    <p className="text-text-secondary font-poppins text-xs">
                      {new Date(transaction.createdAt).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className={`text-lg font-bold ${
                    transaction.type === 'deposit' || transaction.type === 'refund'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}
                    {typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : parseFloat(String(transaction.amount || 0)).toFixed(2)} {transaction.currency}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

