import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Определяет предпочтительный язык из заголовка Accept-Language
 */
function getLocaleFromAcceptLanguage(acceptLanguage: string | null, defaultLocale: string = 'en'): string {
  if (!acceptLanguage) return defaultLocale;
  
  // Парсим Accept-Language заголовок
  // Формат: "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7"
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, q = 'q=1.0'] = lang.trim().split(';');
      const quality = parseFloat(q.replace('q=', ''));
      return { locale: locale.toLowerCase().split('-')[0], quality };
    })
    .sort((a, b) => b.quality - a.quality);
  
  // Маппинг языков браузера на наши локали
  const localeMap: Record<string, string> = {
    'uk': 'ua', // Украинский
    'ru': 'ru', // Русский
    'en': 'en', // Английский
    'es': 'es', // Испанский
    'fr': 'fr', // Французский
    'de': 'de', // Немецкий
    'it': 'it', // Итальянский
    'ca': 'ca', // Каталонский
    'nl': 'nl', // Нидерландский
    'da': 'da', // Датский
    'sv': 'sv', // Шведский
    'no': 'no', // Норвежский
    'ar': 'ar', // Арабский
    'zh': 'zh', // Китайский
  };
  
  // Ищем первый поддерживаемый язык
  for (const { locale } of languages) {
    if (localeMap[locale] && locales.includes(localeMap[locale] as any)) {
      return localeMap[locale];
    }
  }
  
  return defaultLocale;
}

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'always',
  // Определение языка из заголовка Accept-Language браузера
  localeDetection: true
});

export default function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  
  // Сразу пропускаем API routes, статические файлы и служебные пути
  // Это критично для webhook endpoints от Resend и других внешних сервисов
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }
  
  // Проверяем, содержит ли путь локаль
  const hasLocale = /^\/(en|es|ua|ru|ca|zh|nl|da|sv|de|no|it|fr|ar)(\/|$)/.test(pathname);
  
  // Если путь не содержит локали и это не API/статические файлы/корневой путь
  if (!hasLocale && pathname !== '/' && !pathname.startsWith('/api') && !pathname.startsWith('/_next') && !pathname.startsWith('/_vercel')) {
    const acceptLanguage = request.headers.get('accept-language');
    const detectedLocale = getLocaleFromAcceptLanguage(acceptLanguage, 'en');
    
    // Создаем новый URL с локалью
    const newPath = `/${detectedLocale}${pathname}`;
    const redirectUrl = new URL(newPath, request.url);
    redirectUrl.search = url.search; // Сохраняем query параметры
    
    // Добавляем специальный query параметр, чтобы клиент знал, что был редирект
    redirectUrl.searchParams.set('_localeRedirect', 'true');
    
    const response = NextResponse.redirect(redirectUrl);
    return response;
  }
  
  // Проверяем, содержит ли путь закодированный якорь %23
  if (pathname.includes('%23')) {
    // Разделяем путь и hash часть
    const parts = pathname.split('%23');
    const basePath = parts[0];
    const hashPart = parts.slice(1).join('#');
    
    // Определяем локаль из пути или из Accept-Language
    let locale = 'en';
    const localeMatch = basePath.match(/^\/(en|es|ua|ru|ca|zh|nl|da|sv|de|no|it|fr|ar)/);
    if (localeMatch) {
      locale = localeMatch[1];
    } else {
      const acceptLanguage = request.headers.get('accept-language');
      locale = getLocaleFromAcceptLanguage(acceptLanguage, 'en');
    }
    
    // Создаем новый URL с правильной локалью
    const pathWithoutLocale = basePath.replace(/^\/(en|es|ua|ru|ca|zh|nl|da|sv|de|no|it|fr|ar)/, '') || basePath;
    const redirectUrl = new URL(`/${locale}${pathWithoutLocale}`, request.url);
    redirectUrl.search = url.search; // Сохраняем query параметры
    
    // Добавляем hash в query параметр для передачи на клиент
    redirectUrl.searchParams.set('_redirectHash', hashPart);
    
    // Перенаправляем на правильный URL
    const response = NextResponse.redirect(redirectUrl);
    
    // Добавляем заголовок для клиента
    response.headers.set('X-Hash-Redirect', hashPart);
    
    return response;
  }
  
  // Продолжаем с обычной обработкой next-intl
  const response = intlMiddleware(request);
  
  // Если есть hash в query параметре, добавляем заголовок для клиента
  const redirectHash = url.searchParams.get('_redirectHash');
  if (redirectHash) {
    response.headers.set('X-Hash-Redirect', redirectHash);
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};


