'use client';

import React, { createContext, useContext, useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { translations, Locale } from '@/config/translations';

interface LocaleContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, params?: Record<string, string>) => string;
  isPending: boolean;
}

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Keep state in sync if initialLocale changes
  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Refresh the router to reload Server Components with the new locale
    startTransition(() => {
      router.refresh();
    });
  };

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

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, isPending }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
