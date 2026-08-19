import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.ADMIN) {
    redirect('/login');
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-primary">
          Portal Configurations
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Set global portal settings, email configurations, and backup parameters.
        </p>
      </div>

      <Card className="border-border shadow-xs">
        <CardHeader className="bg-card px-6 py-4 border-b border-border">
          <CardTitle className="text-base font-bold text-foreground tracking-tight uppercase flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary shrink-0" />
            <span>Admin Global Configurations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-sm text-foreground/90">
          <div className="border-b border-border/50 pb-4">
            <h4 className="font-bold mb-1 font-sans text-primary">Global Portal Status</h4>
            <p className="text-xs text-muted-foreground">Toggle open-access submissions system-wide. Current status: Active.</p>
          </div>
          <div className="border-b border-border/50 pb-4">
            <h4 className="font-bold mb-1 font-sans text-primary">System Backup Preferences</h4>
            <p className="text-xs text-muted-foreground">Export and sync database logs to external cloud storage. Current: Enabled.</p>
          </div>
          <div>
            <h4 className="font-bold mb-1 font-sans text-primary">SMTP Mail Configuration</h4>
            <p className="text-xs text-muted-foreground">Manage transactional server notifications parameters. Current: Connected (SMTP).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
