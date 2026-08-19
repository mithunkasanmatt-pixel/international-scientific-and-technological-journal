import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTranslationServer } from '@/utils/locale';
import { AdminDashboardView } from '@/components/admin-dashboard-view';
import { Role } from '@prisma/client';

export default async function AdminLogsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.ADMIN) {
    redirect('/login');
  }

  const { t } = await getTranslationServer();

  // Query all users
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reviewerProfile: true,
    },
  });

  // Query all activity logs
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
          System Audit Logs
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review recent system activities, user promotions, and status adjustments.
        </p>
      </div>

      <AdminDashboardView users={users} logs={logs} currentAdminId={session.user.id} defaultTab="logs" />
    </div>
  );
}
