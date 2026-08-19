'use client';

import React from 'react';
import { useLocale } from '@/hooks/use-locale';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, setLocale, isPending } = useLocale();

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      disabled={isPending}
      className="flex items-center gap-2 rounded-md border border-primary/80 bg-background px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50 transition-all cursor-pointer"
      title={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
    >
      <Globe className="h-4 w-4 text-primary" />
      <span className="font-sans">{locale === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
}
