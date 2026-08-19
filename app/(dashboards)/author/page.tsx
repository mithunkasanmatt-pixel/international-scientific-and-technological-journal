import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTranslationServer } from '@/utils/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AuthorPapersList } from '@/components/author-papers-list';
import { FileText, Hourglass, CheckCircle, RotateCcw } from 'lucide-react';

export default async function AuthorDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || session.user.role !== 'AUTHOR') {
    redirect('/login');
  }

  const { t } = await getTranslationServer();

  // Query submissions for the author
  const papers = await prisma.submission.findMany({
    where: { submitterId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      timeline: {
        orderBy: { createdAt: 'asc' },
      },
      authors: true,
    },
  });

  // Calculate statistics
  const totalSubmissions = papers.length;
  const underReviewCount = papers.filter((p) => p.status === 'UNDER_REVIEW' || p.status === 'ASSIGNED').length;
  const acceptedCount = papers.filter((p) => p.status === 'ACCEPTED' || p.status === 'PUBLISHED').length;
  const revisionCount = papers.filter((p) => p.status === 'REVISION_REQUIRED').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
          {t('common.dashboard')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Submit new papers, upload revisions, and trace peer-review status.
        </p>
      </div>

      {/* Grid stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Submissions
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Under Review
            </CardTitle>
            <Hourglass className="h-4 w-4 text-amber-500 animate-spin-slow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{underReviewCount}</div>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Revisions Requested
            </CardTitle>
            <RotateCcw className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revisionCount}</div>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Accepted & Published
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Paper List */}
      <div>
        <h3 className="text-lg font-bold tracking-tight mb-4">{t('dashboards.author.myPapers')}</h3>
        <AuthorPapersList papers={papers} />
      </div>
    </div>
  );
}
