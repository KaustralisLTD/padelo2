import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';
import { NextRequest, NextResponse } from 'next/server';

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
  
  // Проверяем, содержит ли путь закодированный якорь %23
  if (pathname.includes('%23')) {
    // Разделяем путь и hash часть
    const parts = pathname.split('%23');
    const basePath = parts[0];
    const hashPart = parts.slice(1).join('#');
    
    // Создаем новый URL с правильным путем
    const redirectUrl = new URL(basePath, request.url);
    redirectUrl.search = url.search; // Сохраняем query параметры
    
    // Добавляем hash в query параметр для передачи на клиент
    // Клиент обработает это и установит правильный hash
    redirectUrl.searchParams.set('_redirectHash', hashPart);
    
    // Перенаправляем на правильный URL
    const response = NextResponse.redirect(redirectUrl);
    
    // Добавляем заголовок для клиента
    response.headers.set('X-Hash-Redirect', hashPart);
    
    return response;
  }
  
  // Продолжаем с обычной обработкой next-intl
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};


