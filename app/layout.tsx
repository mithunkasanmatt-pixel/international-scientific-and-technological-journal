import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { getLocaleServer } from '@/utils/locale';
import { Providers } from '@/components/providers';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Journal Submission & Publishing System',
    template: '%s | Journal Submission & Publishing System',
  },
  description: 'Enterprise Academic Editorial Workflow & Journal Publishing System',
  keywords: ['academic', 'journal', 'submission', 'publishing', 'editorial', 'review', 'peer-review'],
  authors: [{ name: 'Academic Publishing Team' }],
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleServer();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
