'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
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
import Image from 'next/image';
import { checkEmailRoles } from '@/actions/auth';

export default function LoginPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Dynamically check roles when email looks valid
  useEffect(() => {
    const checkRoles = async () => {
      const trimmed = email.trim();
      if (trimmed && trimmed.includes('@') && trimmed.includes('.')) {
        try {
          const res = await checkEmailRoles(trimmed);
          if (res && res.roles) {
            setAvailableRoles(res.roles);
            if (res.roles.length === 2 && res.roles.includes('AUTHOR') && res.roles.includes('REVIEWER')) {
              setSelectedRole(''); // Force explicit selection
            } else if (res.roles.length === 1) {
              setSelectedRole(res.roles[0]);
            } else {
              setSelectedRole('');
            }
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        setAvailableRoles([]);
        setSelectedRole('');
      }
    };
    checkRoles();
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('auth.fieldRequired'));
      return;
    }

    if (availableRoles.includes('AUTHOR') && availableRoles.includes('REVIEWER') && !selectedRole) {
      toast.error('Please select a login role first.');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        role: selectedRole,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(t('common.success'));
        // Fetch session to determine role-based redirect
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        
        const role = session?.user?.role;
        
        // Auto redirect to correct dashboard
        if (role === 'ADMIN') router.push('/admin');
        else if (role === 'CHIEF_EDITOR') router.push('/chief-editor');
        else if (role === 'EDITOR') router.push('/editor');
        else if (role === 'GUEST_EDITOR') router.push('/guest-editor');
        else if (role === 'REVIEWER') router.push('/reviewer');
        else if (role === 'AUTHOR') router.push('/author');
        else router.push('/');
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

      {/* Main Card */}
      <div className="flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-md shadow-lg border-border" glass>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {t('auth.loginTitle')}
            </CardTitle>
            <CardDescription>
              {t('common.tagline')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Role selector when email matches multiple roles */}
              {availableRoles.includes('AUTHOR') && availableRoles.includes('REVIEWER') && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Login Role *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('AUTHOR')}
                      className={`px-4 py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                        selectedRole === 'AUTHOR'
                          ? 'bg-primary border-primary text-white shadow-xs'
                          : 'bg-card border-border hover:bg-secondary/40 text-muted-foreground'
                      }`}
                    >
                      Login as Author
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('REVIEWER')}
                      className={`px-4 py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                        selectedRole === 'REVIEWER'
                          ? 'bg-primary border-primary text-white shadow-xs'
                          : 'bg-card border-border hover:bg-secondary/40 text-muted-foreground'
                      }`}
                    >
                      Login as Reviewer
                    </button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? t('common.loading') : t('common.login')}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">{t('auth.noAccount')} </span>
              <Link href="/register" className="text-primary hover:underline font-semibold">
                {t('common.register')}
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
