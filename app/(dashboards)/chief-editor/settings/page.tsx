import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Role } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default async function ChiefEditorSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.CHIEF_EDITOR) {
    redirect('/login');
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-primary">
          Portal Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Configure general system preferences, review timelines, and email templates for editorial staff.
        </p>
      </div>

      <Card className="border-border shadow-xs">
        <CardHeader className="bg-card px-6 py-4 border-b border-border">
          <CardTitle className="text-base font-bold text-foreground tracking-tight uppercase flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary shrink-0" />
            <span>Chief Editor Configurations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-sm text-foreground/90">
          <div className="border-b border-border/50 pb-4">
            <h4 className="font-bold mb-1">Double-Blind Review Cycles</h4>
            <p className="text-xs text-muted-foreground">Define default peer reviewer response times. Current default: 14 days.</p>
          </div>
          <div className="border-b border-border/50 pb-4">
            <h4 className="font-bold mb-1">Email Dispatch Settings</h4>
            <p className="text-xs text-muted-foreground">Toggle automated notifications to authors on status transitions. Current status: Enabled.</p>
          </div>
          <div>
            <h4 className="font-bold mb-1">Backup & Archive</h4>
            <p className="text-xs text-muted-foreground">Schedule automatic exports of accepted manuscripts metadata. Current status: Weekly, Sunday 00:00.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
