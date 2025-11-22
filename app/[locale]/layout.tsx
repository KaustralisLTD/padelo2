import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { locales } from '@/i18n';
import ClientProviders from '@/components/providers/ClientProviders';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <WhatsAppButton />
            <ThemeToggle />
          </NextIntlClientProvider>
        </ClientProviders>
      </body>
    </html>
  );
}

