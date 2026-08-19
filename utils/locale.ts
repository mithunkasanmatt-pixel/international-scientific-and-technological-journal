import { cookies } from 'next/headers';
import { translations, Locale } from '@/config/translations';

export async function getLocaleServer(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value as Locale;
  return locale === 'ar' ? 'ar' : 'en';
}

export async function getTranslationServer() {
  const locale = await getLocaleServer();
  
  const t = (path: string, params?: Record<string, string>): string => {
    const parts = path.split('.');
    let current: any = translations[locale];

    for (const part of parts) {
      if (current === undefined || current === null) {
        return path;
      }
      current = current[part];
    }

    if (typeof current !== 'string') {
      return path;
    }

    let result = current;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{${key}}`, 'g'), value);
      });
    }

    return result;
  };

  return { locale, t };
}
