'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { registerAuthor, registerReviewer } from '@/actions/auth';
import Image from 'next/image';

export default function RegisterPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [roleType, setRoleType] = useState<'author' | 'reviewer'>('author');
  const [loading, setLoading] = useState(false);

  // Author fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Reviewer fields
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [reviewerPassword, setReviewerPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [domains, setDomains] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      if (roleType === 'author') {
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);

        const res = await registerAuthor(formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(t('common.success') + '! Welcome email sent.');
          router.push('/login');
        }
      } else {
        formData.append('name', reviewerName);
        formData.append('email', reviewerEmail);
        formData.append('password', reviewerPassword);
        formData.append('institution', institution);
        formData.append('domains', domains);

        const res = await registerReviewer(formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(t('auth.reviewerPendingApproval'));
          router.push('/login');
        }
      }
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#1c7c22] dark:bg-background p-4 sm:p-6 lg:p-8">
      {/* Header controls */}
      <header className="flex justify-between items-center w-full max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white dark:text-foreground">
          <Image
            src="/logo.png"
            alt="IST Logo"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
          <span>{t('common.appName')}</span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-lg shadow-lg border-border" glass>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {t('auth.registerTitle')}
            </CardTitle>
            <CardDescription>{t('common.tagline')}</CardDescription>

            {/* Role switch toggle */}
            <div className="flex gap-2 bg-secondary p-1 rounded-lg mt-4">
              <button
                type="button"
                onClick={() => setRoleType('author')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  roleType === 'author'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('auth.authorRegister')}
              </button>
              <button
                type="button"
                onClick={() => setRoleType('reviewer')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  roleType === 'reviewer'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('auth.reviewerRegister')}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {roleType === 'author' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('auth.name')}</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="revName">{t('auth.name')}</Label>
                    <Input
                      id="revName"
                      type="text"
                      placeholder="Dr. John Doe"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="revEmail">{t('auth.email')}</Label>
                    <Input
                      id="revEmail"
                      type="email"
                      placeholder="john.doe@university.edu"
                      value={reviewerEmail}
                      onChange={(e) => setReviewerEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="revPassword">{t('auth.password')}</Label>
                    <Input
                      id="revPassword"
                      type="password"
                      value={reviewerPassword}
                      onChange={(e) => setReviewerPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institution">{t('auth.institution')}</Label>
                    <Input
                      id="institution"
                      type="text"
                      placeholder="Harvard University"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domains">{t('auth.domains')}</Label>
                    <Input
                      id="domains"
                      type="text"
                      placeholder="AI, Machine Learning, Deep Learning (comma separated)"
                      value={domains}
                      onChange={(e) => setDomains(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full mt-4" disabled={loading}>
                {loading ? t('common.loading') : t('common.register')}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">{t('auth.alreadyHaveAccount')} </span>
              <Link href="/login" className="text-primary hover:underline font-semibold">
                {t('common.login')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-white/70 dark:text-muted-foreground w-full max-w-7xl mx-auto border-t border-white/20 dark:border-border/50 pt-4">
        &copy; {new Date().getFullYear()} {t('common.appName')}. All rights reserved.
      </footer>
    </div>
  );
}
