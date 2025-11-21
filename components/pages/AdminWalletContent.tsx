'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Wallet {
  id: number;
  userId: string;
  userEmail: string;
  userName: string;
  balance: number;
  currency: string;
  updatedAt: string;
}

interface Transaction {
  id: number;
  walletId: number;
  userId: string;
  userEmail: string;
  userName: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'transfer';
  amount: number;
  currency: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdBy: string | null;
  createdAt: string;
}

export default function AdminWalletContent() {
  const t = useTranslations('Admin.wallet');
  const tCommon = useTranslations('Admin');
  const locale = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions'>('wallets');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/login`);
      return;
    }

    // Verify admin access
    fetch('/api/auth/login', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.session || data.session.role !== 'superadmin') {
          router.push(`/${locale}/dashboard`);
        } else {
          fetchData();
        }
      })
      .catch(() => {
        router.push(`/${locale}/login`);
      });
  }, [locale, router]);

  const fetchData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      if (activeTab === 'wallets') {
        const response = await fetch('/api/admin/wallet/wallets', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setWallets(data.wallets || []);
        } else {
          setError('Failed to load wallets');
        }
      } else {
        const response = await fetch('/api/admin/wallet/transactions', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setTransactions(data.transactions || []);
        } else {
          setError('Failed to load transactions');
        }
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [activeTab, token]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 mt-20">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-text-secondary font-poppins">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/${locale}/dashboard`}
            className="text-text-secondary hover:text-primary font-poppins transition-colors"
          >
            ← {tCommon('backToDashboard')}
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text">
            {t('title')}
          </h1>
          <p className="text-xl text-text-secondary font-poppins">
            {t('description')}
          </p>
        </div>

        {/* Вкладки */}
        <div className="mb-6 flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('wallets')}
            className={`px-6 py-3 font-poppins font-semibold transition-colors border-b-2 ${
              activeTab === 'wallets'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            {t('wallets')}
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 font-poppins font-semibold transition-colors border-b-2 ${
              activeTab === 'transactions'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text'
            }`}
          >
            {t('transactions')}
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border border-red-500/30 rounded-lg p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-text font-poppins font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Контент вкладок */}
        {activeTab === 'wallets' && (
          <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-poppins font-semibold text-text">{t('walletsTable.user')}</th>
                    <th className="text-left p-4 font-poppins font-semibold text-text">{t('walletsTable.email')}</th>
                    <th className="text-right p-4 font-poppins font-semibold text-text">{t('walletsTable.balance')}</th>
                    <th className="text-left p-4 font-poppins font-semibold text-text">{t('walletsTable.currency')}</th>
                    <th className="text-left p-4 font-poppins font-semibold text-text">{t('walletsTable.updatedAt')}</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-secondary font-poppins">
                        {t('walletsTable.noWallets')}
                      </td>
                    </tr>
                  ) : (
                    wallets.map((wallet) => (
                      <tr key={wallet.id} className="border-b border-border hover:bg-background/50">
                        <td className="p-4 text-text font-poppins">
                          {wallet.userName}
                        </td>
                        <td className="p-4 text-text-secondary font-poppins">
                          {wallet.userEmail}
                        </td>
                        <td className="p-4 text-right text-text font-poppins font-semibold">
                          {wallet.balance.toFixed(2)}
                        </td>
                        <td className="p-4 text-text-secondary font-poppins">
                          {wallet.currency}
                        </td>
                        <td className="p-4 text-text-secondary font-poppins">
                          {new Date(wallet.updatedAt).toLocaleString(locale)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-background-secondary rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-poppins font-semibold text-text">{t('transactionsTable.id')}</th>
                    <th className="text-left p-4 font-poppins font-semibold text-text">{t('transactionsTable.user')}</th>
                    <th className="text-left p-4 font-poppins font-semibold text-text">{t('transactionsTable.type')}</th>
                    <th className="text-right p-4 font-poppins font-semibold text-text">{t('transactionsTable.amount')}</th>
                    <th className="text-left p-4 font-poppins font-semibold text-text">{t('transactionsTable.status')}</th>
                    <th className="text-left p-4 font-poppins font-semibold text-text">{t('transactionsTable.description')}</th>
                    <th className="text-left p-4 font-poppins font-semibold text-text">{t('transactionsTable.createdAt')}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-text-secondary font-poppins">
                        {t('transactionsTable.noTransactions')}
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-border hover:bg-background/50">
                        <td className="p-4 text-text-secondary font-poppins">
                          #{transaction.id}
                        </td>
                        <td className="p-4 text-text font-poppins">
                          {transaction.userName}
                          <div className="text-xs text-text-secondary">{transaction.userEmail}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-poppins ${
                            transaction.type === 'deposit' ? 'bg-green-500/20 text-green-400' :
                            transaction.type === 'withdrawal' ? 'bg-red-500/20 text-red-400' :
                            transaction.type === 'payment' ? 'bg-blue-500/20 text-blue-400' :
                            transaction.type === 'refund' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {t(`transactionTypes.${transaction.type}`)}
                          </span>
                        </td>
                        <td className={`p-4 text-right font-poppins font-semibold ${
                          transaction.type === 'deposit' || transaction.type === 'refund' ? 'text-green-400' :
                          transaction.type === 'withdrawal' || transaction.type === 'payment' ? 'text-red-400' :
                          'text-text'
                        }`}>
                          {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}
                          {transaction.amount.toFixed(2)} {transaction.currency}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-poppins ${
                            transaction.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            transaction.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {t(`transactionStatus.${transaction.status}`)}
                          </span>
                        </td>
                        <td className="p-4 text-text-secondary font-poppins text-sm">
                          {transaction.description || '-'}
                        </td>
                        <td className="p-4 text-text-secondary font-poppins text-sm">
                          {new Date(transaction.createdAt).toLocaleString(locale)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

