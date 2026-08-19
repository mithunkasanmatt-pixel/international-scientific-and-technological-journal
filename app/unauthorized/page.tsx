'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  const { t } = useLocale();
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md text-center shadow-lg border-destructive/20" glass>
        <CardHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-destructive">
            {t('common.unauthorized')}
          </CardTitle>
          <CardDescription>
            You do not have access permissions to view this dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please verify your credentials and sign-in status. If you are a newly registered reviewer,
            your account must be approved by the Chief Editor before accessing the dashboard.
          </p>
          <Button onClick={() => router.push('/login')} className="w-full">
            {t('common.back')} {t('common.login')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
