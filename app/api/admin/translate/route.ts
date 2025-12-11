import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/users';

const SUPPORTED_LANGUAGES = ['en', 'ru', 'ua', 'es', 'fr', 'de', 'it', 'ca', 'nl', 'da', 'sv', 'no', 'ar', 'zh'];

const GOOGLE_TRANSLATE_LOCALE_MAP: Record<string, string> = {
  'en': 'en',
  'ru': 'ru',
  'ua': 'uk',
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
  'zh': 'zh',
};

async function checkAdminAccess(request: NextRequest): Promise<{ authorized: boolean }> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

  if (!token) {
    return { authorized: false };
  }

  const session = await getSession(token);
  if (!session || session.role !== 'superadmin') {
    return { authorized: false };
  }

  return { authorized: true };
}

export async function POST(request: NextRequest) {
  const access = await checkAdminAccess(request);
  if (!access.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { text, targetLang, sourceLang = 'en' } = body;

    if (!text || !targetLang) {
      return NextResponse.json({ error: 'Text and targetLang are required' }, { status: 400 });
    }

    if (targetLang === sourceLang) {
      return NextResponse.json({ translatedText: text });
    }

    if (!SUPPORTED_LANGUAGES.includes(targetLang)) {
      return NextResponse.json({ error: 'Unsupported target language' }, { status: 400 });
    }

    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
      return NextResponse.json({ error: 'Google Translate API key not configured' }, { status: 500 });
    }

    const googleTargetLang = GOOGLE_TRANSLATE_LOCALE_MAP[targetLang] || targetLang;
    const googleSourceLang = GOOGLE_TRANSLATE_LOCALE_MAP[sourceLang] || sourceLang;

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: googleSourceLang,
          target: googleTargetLang,
          format: 'text',
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ 
        error: 'Translation failed', 
        details: errorData 
      }, { status: response.status });
    }

    const data = await response.json();
    const translatedText = data.data?.translations?.[0]?.translatedText || text;

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error('Translation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

