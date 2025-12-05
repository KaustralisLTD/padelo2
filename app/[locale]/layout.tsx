import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { locales } from '@/i18n';
import ClientProviders from '@/components/providers/ClientProviders';
import ConditionalHeader from '@/components/ConditionalHeader';
import ConditionalFooter from '@/components/ConditionalFooter';
import WhatsAppButton from '@/components/WhatsAppButton';
import ThemeToggle from '@/components/ThemeToggle';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { generateOrganizationSchema, generateWebSiteSchema } from '@/lib/schema';
import '../globals.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Home' });
  
  return generateSEOMetadata({
    title: t('title') || 'PadelO₂ - Breathe and Live',
    description: t('subhead') || 'Innovative padel sports ecosystem combining tournaments, training, AI-powered machines, and global court construction.',
    keywords: ['padel', 'tournaments', 'training', 'AI machines', 'padel courts', 'investments', 'padel academy', 'padel equipment'],
    path: '',
  }, locale);
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  // Generate Schema.org structured data
  const organizationSchema = generateOrganizationSchema(locale);
  const websiteSchema = generateWebSiteSchema(locale);

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                
                // Обработка hash при редиректе на локаль
                if (typeof window !== 'undefined') {
                  const pathname = window.location.pathname;
                  const hash = window.location.hash;
                  const hasLocale = /^\/(en|es|ua|ru|ca|zh|nl|da|sv|de|no|it|fr|ar)(\/|$)/.test(pathname);
                  
                  // Если путь не содержит локали и есть hash, сохраняем hash и делаем редирект
                  if (!hasLocale && hash && pathname !== '/' && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
                    // Определяем язык из Accept-Language
                    const acceptLanguage = navigator.language || navigator.languages?.[0] || 'en';
                    const browserLang = acceptLanguage.toLowerCase().split('-')[0];
                    
                    const localeMap = {
                      'uk': 'ua',
                      'ru': 'ru',
                      'en': 'en',
                      'es': 'es',
                      'fr': 'fr',
                      'de': 'de',
                      'it': 'it',
                      'ca': 'ca',
                      'nl': 'nl',
                      'da': 'da',
                      'sv': 'sv',
                      'no': 'no',
                      'ar': 'ar',
                      'zh': 'zh'
                    };
                    
                    const detectedLocale = localeMap[browserLang] || 'en';
                    const newPath = '/' + detectedLocale + pathname + hash;
                    window.location.replace(newPath);
                    return; // Прерываем выполнение, так как будет редирект
                  }
                  
                  // Если был редирект на локаль и hash был потерян, проверяем sessionStorage
                  const savedHash = sessionStorage.getItem('_pendingHash');
                  if (savedHash && hash !== savedHash) {
                    sessionStorage.removeItem('_pendingHash');
                    window.location.hash = savedHash;
                  }
                }
              })();
            `,
          }}
        />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-8N7DGYN644"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-8N7DGYN644');
          `}
        </Script>
        {/* Schema.org Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        {/* Schema.org WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        {/* Additional meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#00C4FF" />
        <meta name="msapplication-TileColor" content="#00C4FF" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <ClientProviders>
          <NextIntlClientProvider messages={messages}>
            <ConditionalHeader />
            <main className="min-h-screen">{children}</main>
            <ConditionalFooter />
            <WhatsAppButton />
            <ThemeToggle />
          </NextIntlClientProvider>
        </ClientProviders>
      </body>
    </html>
  );
}

