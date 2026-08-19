'use client';

import React from 'react';
import { SessionProvider } from './session-provider';
import { ThemeProvider } from './theme-provider';
import { LocaleProvider } from '@/hooks/use-locale';
import { QueryProvider } from './query-provider';
import { Toaster } from 'sonner';
import { Locale } from '@/config/translations';

interface ProvidersProps {
  children: React.ReactNode;
  initialLocale: Locale;
}

export function Providers({ children, initialLocale }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LocaleProvider initialLocale={initialLocale}>
          <QueryProvider>
            {children}
            <Toaster 
              position={initialLocale === 'ar' ? 'bottom-left' : 'bottom-right'} 
              richColors 
              theme="system"
            />
          </QueryProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
