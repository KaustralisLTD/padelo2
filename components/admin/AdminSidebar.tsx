'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  children?: MenuItem[];
}

interface Tournament {
  id: number;
  name: string;
}

export default function AdminSidebar() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Admin');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage and dispatch event
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(isCollapsed));
    // Dispatch custom event to notify layout
    window.dispatchEvent(new CustomEvent('adminSidebarToggle'));
  }, [isCollapsed]);

  // Auto-expand tournaments menu if on participants page
  useEffect(() => {
    if (pathname?.match(/\/admin\/tournaments\/\d+\/participants/)) {
      setExpandedItems(prev => {
        if (!prev.includes(`/${locale}/admin/tournaments`)) {
          return [...prev, `/${locale}/admin/tournaments`];
        }
        return prev;
      });
    }
  }, [pathname, locale]);

  // Fetch tournaments for participants submenu
  useEffect(() => {
    const fetchTournaments = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return;

      setLoadingTournaments(true);
      try {
        const response = await fetch('/api/admin/tournaments', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setTournaments(data.tournaments || []);
        }
      } catch (error) {
        console.error('Error fetching tournaments for sidebar:', error);
      } finally {
        setLoadingTournaments(false);
      }
    };

    fetchTournaments();
  }, []);

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev =>
      prev.includes(href) ? prev.filter(item => item !== href) : [...prev, href]
    );
  };

  const menuItems: MenuItem[] = [
    {
      href: `/${locale}/admin/dashboard`,
      label: t('dashboard.title') || 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/users`,
      label: t('users.title') || 'Users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/tournaments`,
      label: t('tournaments.title') || 'Tournaments',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      children: [
        {
          href: `/${locale}/admin/tournaments`,
          label: t('tournaments.active') || 'Active Tournaments',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          ),
        },
      ],
    },
    {
      href: `/${locale}/admin/staff`,
      label: t('staff.title') || 'Staff',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/wallet`,
      label: t('wallet.title') || 'Wallet',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/logs`,
      label: t('logs.title') || 'Logs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/db-monitor`,
      label: t('dbMonitor.title') || 'Database Monitor',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/partner-emails`,
      label: 'Email Templates',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/messages`,
      label: t('messages.title') || 'Messages',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      href: `/${locale}/admin/settings`,
      label: t('settings.title') || 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/admin/dashboard`) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  // Check if any tournament participants page is active
  const isTournamentParticipantsActive = pathname?.match(/\/admin\/tournaments\/\d+\/participants/);

  return (
    <div className={`fixed left-0 top-0 h-full bg-background-secondary border-r border-border z-40 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header with collapse button */}
      <div className="p-4 border-b border-border flex items-center justify-between relative">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-background font-bold text-xl">P</span>
            </div>
            <div>
              <h2 className="font-poppins font-bold text-text text-lg">PadelO₂</h2>
              <p className="text-xs text-text-tertiary font-poppins">Admin Panel</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
            <span className="text-background font-bold text-xl">P</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 p-2 rounded-lg hover:bg-background-hover transition-colors bg-background-secondary border border-border z-10 ${isCollapsed ? '' : ''}`}
          title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          <svg
            className={`w-5 h-5 text-text-secondary transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.href);
            const isTournamentsItem = item.href.includes('/tournaments');

            return (
              <li key={item.href}>
                {hasChildren ? (
                  <>
                    {isCollapsed && isTournamentsItem ? (
                      <Link
                        href={item.href}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-poppins text-sm ${
                          active || isTournamentParticipantsActive
                            ? 'bg-primary/10 text-primary border-l-2 border-primary'
                            : 'text-text-secondary hover:bg-background-hover hover:text-text'
                        } justify-center`}
                        title={item.label}
                      >
                        <span className={active || isTournamentParticipantsActive ? 'text-primary' : 'text-text-tertiary'}>
                          {item.icon}
                        </span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => toggleExpanded(item.href)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-poppins text-sm ${
                          active || isTournamentParticipantsActive
                            ? 'bg-primary/10 text-primary border-l-2 border-primary'
                            : 'text-text-secondary hover:bg-background-hover hover:text-text'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? item.label : undefined}
                      >
                      <span className={active || isTournamentParticipantsActive ? 'text-primary' : 'text-text-tertiary'}>
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                          <svg
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </>
                      )}
                      </button>
                    )}
                    {!isCollapsed && isExpanded && item.children && (
                      <ul className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => {
                          // For tournaments, add participants submenu
                          if (isTournamentsItem && child.href.includes('/tournaments')) {
                            return (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-poppins text-sm ${
                                    isActive(child.href) && !isTournamentParticipantsActive
                                      ? 'bg-primary/10 text-primary'
                                      : 'text-text-secondary hover:bg-background-hover hover:text-text'
                                  }`}
                                >
                                  <span className="text-xs">•</span>
                                  <span>{child.label}</span>
                                </Link>
                                {/* Participants submenu */}
                                {tournaments.length > 0 && (
                                  <ul className="ml-6 mt-1 space-y-1">
                                    <li className="px-4 py-1">
                                      <span className="text-xs text-text-tertiary font-poppins">
                                        {t('tournaments.participants') || 'Participants'}
                                      </span>
                                    </li>
                                    {tournaments.slice(0, 10).map((tournament) => {
                                      const participantsHref = `/${locale}/admin/tournaments/${tournament.id}/participants`;
                                      const isParticipantActive = pathname === participantsHref;
                                      return (
                                        <li key={tournament.id}>
                                          <Link
                                            href={participantsHref}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-poppins text-xs ${
                                              isParticipantActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-text-secondary hover:bg-background-hover hover:text-text'
                                            }`}
                                            title={tournament.name}
                                          >
                                            <span className="text-xs">→</span>
                                            <span className="truncate">{tournament.name}</span>
                                          </Link>
                                        </li>
                                      );
                                    })}
                                    {tournaments.length > 10 && (
                                      <li className="px-4 py-1">
                                        <span className="text-xs text-text-tertiary font-poppins">
                                          +{tournaments.length - 10} {t('tournaments.more') || 'more'}
                                        </span>
                                      </li>
                                    )}
                                  </ul>
                                )}
                              </li>
                            );
                          }
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors font-poppins text-sm ${
                                  isActive(child.href)
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-text-secondary hover:bg-background-hover hover:text-text'
                                }`}
                              >
                                <span className="text-xs">•</span>
                                <span>{child.label}</span>
                                {child.badge && (
                                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-auto">
                                    {child.badge}
                                  </span>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-poppins text-sm ${
                      active
                        ? 'bg-primary/10 text-primary border-l-2 border-primary'
                        : 'text-text-secondary hover:bg-background-hover hover:text-text'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={active ? 'text-primary' : 'text-text-tertiary'}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        {!isCollapsed && (
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-text-secondary hover:bg-background-hover hover:text-text transition-colors font-poppins text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
        )}
        {isCollapsed && (
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center justify-center px-4 py-2 rounded-lg text-text-secondary hover:bg-background-hover hover:text-text transition-colors"
            title="Back to Dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        )}
        <button
          onClick={() => {
            localStorage.removeItem('auth_token');
            router.push(`/${locale}/login`);
          }}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-text-secondary hover:bg-background-hover hover:text-text transition-colors font-poppins text-sm ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? t('logout') || 'Logout' : undefined}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span>{t('logout') || 'Logout'}</span>}
        </button>
      </div>
    </div>
  );
}
