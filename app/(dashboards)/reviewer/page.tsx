import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTranslationServer } from '@/utils/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ReviewerTaskList } from '@/components/reviewer-task-list';
import { ClipboardCheck, FileWarning, Hourglass } from 'lucide-react';

export default async function ReviewerDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== 'REVIEWER') {
    redirect('/login');
  }

  const { t } = await getTranslationServer();

  // Query reviews assigned to this reviewer
  const reviews = await prisma.review.findMany({
    where: { reviewerId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      submission: true,
    },
  });

  // Calculate statistics
  const totalTasks = reviews.length;
  const pendingCount = reviews.filter((r) => r.status === 'PENDING').length;
  const completedCount = reviews.filter((r) => r.status === 'COMPLETED').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
          {t('common.dashboard')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Evaluate assigned academic papers, submit recommendation checklists, and list mistakes.
        </p>
      </div>

      {/* Grid stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Review Tasks
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pending Reviews
            </CardTitle>
            <Hourglass className="h-4 w-4 text-amber-500 animate-spin-slow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Completed Reports
            </CardTitle>
            <FileWarning className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Reviewer Tasks */}
      <div>
        <h3 className="text-lg font-bold tracking-tight mb-4">{t('dashboards.reviewer.myReviews')}</h3>
        <ReviewerTaskList reviews={reviews} />
      </div>
    </div>
  );
}
