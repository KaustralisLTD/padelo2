'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface Message {
  id: string;
  from: string;
  fromAvatar?: string;
  message: string;
  timestamp: string;
  unread?: number;
  type?: 'user' | 'tournament' | 'training';
}

export default function AdminMessagesContent() {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - в реальности будет загружаться с API
  useEffect(() => {
    // TODO: Загрузить сообщения с API
    setMessages([
      {
        id: '1',
        from: 'Anna Rudolf',
        message: 'Hey there! Just wanted to check...',
        timestamp: '6:01 AM',
        unread: 1,
      },
      {
        id: '2',
        from: 'Steve Richard, Ronald Ri...',
        message: 'Hi! I heard great things about th...',
        timestamp: '9:01 AM',
        unread: 1,
      },
    ]);
  }, []);

  const filteredMessages = messages.filter(msg =>
    msg.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold mb-4 gradient-text">
          {t('messages.title') || 'Messages'}
        </h1>
        <p className="text-xl text-text-secondary font-poppins">
          {t('messages.description') || 'Direct communication with players and trainers'}
        </p>
      </div>

      <div className="flex-1 bg-background-secondary rounded-lg border border-border overflow-hidden flex">
        {/* Left panel - Messages list */}
        <div className="w-1/3 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-poppins font-semibold text-text">
                {t('messages.title') || 'Messages'}
              </h2>
              <button className="p-2 hover:bg-background-hover rounded-lg transition-colors">
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder={t('messages.search') || 'Search'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
              />
              <svg className="w-5 h-5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => setSelectedMessage(message)}
                className={`w-full p-4 border-b border-border hover:bg-background-hover transition-colors text-left ${
                  selectedMessage?.id === message.id ? 'bg-primary/10' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-background font-bold text-sm">
                      {message.from.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-poppins font-semibold text-text truncate">
                        {message.from}
                      </p>
                      <span className="text-xs text-text-tertiary font-poppins">
                        {message.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary font-poppins line-clamp-2">
                      {message.message}
                    </p>
                    {message.unread && message.unread > 0 && (
                      <div className="mt-2 flex justify-end">
                        <span className="bg-primary text-background text-xs px-2 py-0.5 rounded-full font-poppins">
                          {message.unread}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right panel - Chat */}
        <div className="flex-1 flex flex-col">
          {selectedMessage ? (
            <>
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-background font-bold text-sm">
                      {selectedMessage.from.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-poppins font-semibold text-text">
                      {selectedMessage.from}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-center text-text-tertiary text-sm font-poppins py-4">
                  {t('messages.noMessages') || 'No messages yet. Start a conversation!'}
                </div>
              </div>
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={t('messages.typeMessage') || 'Type a message...'}
                    className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-text font-poppins focus:outline-none focus:border-primary"
                  />
                  <button className="p-2 bg-primary text-background rounded-lg hover:opacity-90 transition-opacity">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-text-tertiary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-text-secondary font-poppins">
                  {t('messages.selectMessage') || 'Select a message to start chatting'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

