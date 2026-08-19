import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminDashboardView } from '@/components/admin-dashboard-view';
import { Role } from '@prisma/client';

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.ADMIN) {
    redirect('/login');
  }

  // Fetch all users
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reviewerProfile: true,
    },
  });

  // Fetch recent activity logs
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-primary">
          User Accounts Management
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Toggle account activation, edit security roles, and administer system access permissions.
        </p>
      </div>

      <AdminDashboardView 
        users={users} 
        logs={logs} 
        currentAdminId={session.user.id} 
        defaultTab="users"
      />
    </div>
  );
}
