import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import {
  Users,
  FileText,
  MessageSquare,
  CheckCircle,
  UserPlus,
  BarChart2,
  Activity,
} from 'lucide-react';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.ADMIN) {
    redirect('/login');
  }

  // Fetch counts from database
  const totalUsersCount = await prisma.user.count();
  const totalSubmissionsCount = await prisma.submission.count();
  
  // Pending reviews: review requests assigned but not yet completed
  const pendingReviewsCount = await prisma.review.count({
    where: {
      status: 'PENDING',
    },
  });

  // Published papers count
  const publishedCount = await prisma.submission.count({
    where: {
      status: 'PUBLISHED',
    },
  });

  // Fetch 5 recent activity logs
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const getLogIcon = (action: string) => {
    // Return a styled UserPlus inside a light green circle matching the screenshot
    return (
      <div className="h-9 w-9 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shrink-0">
        <UserPlus className="h-4.5 w-4.5 text-emerald-600" />
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-primary font-sans leading-none">
          Admin Overview
        </h2>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Users */}
        <div className="bg-card rounded-xl p-5 border border-border flex flex-col justify-between shadow-xs border-b-4 border-blue-400">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-3xl font-black text-foreground">{totalUsersCount}</span>
          </div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Total Users
          </span>
        </div>

        {/* Card 2: Submissions */}
        <div className="bg-card rounded-xl p-5 border border-border flex flex-col justify-between shadow-xs border-b-4 border-emerald-600">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-3xl font-black text-foreground">{totalSubmissionsCount}</span>
          </div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Submissions
          </span>
        </div>

        {/* Card 3: Pending Reviews */}
        <div className="bg-card rounded-xl p-5 border border-border flex flex-col justify-between shadow-xs border-b-4 border-amber-500">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
              <MessageSquare className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-3xl font-black text-foreground">{pendingReviewsCount}</span>
          </div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Pending Reviews
          </span>
        </div>

        {/* Card 4: Published */}
        <div className="bg-card rounded-xl p-5 border border-border flex flex-col justify-between shadow-xs border-b-4 border-emerald-500">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-3xl font-black text-foreground">{publishedCount}</span>
          </div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Published
          </span>
        </div>
      </div>

      {/* Main Split Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Recent Activities */}
        <Card className="lg:col-span-2 border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
            <CardTitle className="text-base font-bold text-foreground uppercase tracking-tight">
              Recent Activities
            </CardTitle>
            <BarChart2 className="h-4.5 w-4.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm font-medium">
                No activity logs recorded yet.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-4 p-5 items-start hover:bg-secondary/10 transition-all">
                  {getLogIcon(log.action)}
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground leading-snug uppercase tracking-tight">
                      {log.action.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      {log.details}
                      <span className="mx-1.5 text-muted-foreground/50">•</span>
                      {new Date(log.createdAt).toLocaleString(undefined, {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right Column: Quick Actions Card */}
        <div className="bg-[#054316] text-white p-6 rounded-2xl flex flex-col justify-between shadow-xs border border-emerald-950">
          <div className="space-y-6">
            <h3 className="text-base font-bold tracking-tight border-b border-white/10 pb-4">
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              {/* Action 1: Review Pending Users */}
              <Link 
                href="/admin/reviewer-requests" 
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all font-semibold text-xs text-start cursor-pointer"
              >
                <span>Review Pending Users</span>
                <span className="bg-white/15 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shrink-0">
                  Action Needed
                </span>
              </Link>

              {/* Action 2: Create Announcement */}
              <button 
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all font-semibold text-xs text-left cursor-pointer"
              >
                Create Announcement
              </button>

              {/* Action 3: System Backup */}
              <button 
                className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-all font-semibold text-xs text-left cursor-pointer"
              >
                System Backup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
