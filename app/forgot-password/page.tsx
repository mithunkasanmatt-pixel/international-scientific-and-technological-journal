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
import { requestPasswordReset, resetPasswordWithOtp } from '@/actions/auth';
import { KeyRound } from 'lucide-react';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error(t('auth.fieldRequired'));
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      const res = await requestPasswordReset(formData);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(t('auth.otpSent'));
        setStep('verify');
      }
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      toast.error(t('auth.fieldRequired'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('otp', otp);
      formData.append('newPassword', newPassword);

      const res = await resetPasswordWithOtp(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(t('auth.otpVerified'));
        router.push('/login');
      }
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background p-4 sm:p-6 lg:p-8">
      {/* Header controls */}
      <header className="flex justify-between items-center w-full max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
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
        <Card className="w-full max-w-md shadow-lg border-border" glass>
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {t('auth.resetPassword')}
            </CardTitle>
            <CardDescription>{t('common.tagline')}</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'request' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
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
                <Button type="submit" className="w-full mt-4" disabled={loading}>
                  {loading ? t('common.loading') : t('auth.sendOtp')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">{t('auth.enterOtp')}</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    disabled={loading}
                    className="text-center tracking-widest text-lg font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full mt-4" disabled={loading}>
                  {loading ? t('common.loading') : t('auth.verifyOtp')}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-xs text-primary hover:underline block text-center w-full mt-2 cursor-pointer"
                >
                  {t('common.back')}
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <Link href="/login" className="text-primary hover:underline font-semibold">
                {t('auth.alreadyHaveAccount')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground w-full max-w-7xl mx-auto border-t border-border/50 pt-4">
        &copy; {new Date().getFullYear()} {t('common.appName')}. All rights reserved.
      </footer>
    </div>
  );
}
