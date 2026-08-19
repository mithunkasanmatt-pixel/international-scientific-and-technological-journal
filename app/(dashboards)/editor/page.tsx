import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTranslationServer } from '@/utils/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EditorPapersList } from '@/components/editor-papers-list';
import { FileText, ClipboardList, Clock, Sparkles } from 'lucide-react';
import { Role } from '@prisma/client';

export default async function EditorDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.EDITOR) {
    redirect('/login');
  }

  const { t } = await getTranslationServer();

  // Query submissions visible to this editor (personally assigned or unassigned new papers)
  const papers = await prisma.submission.findMany({
    where: {
      OR: [
        { assignedById: session.user.id },
        {
          editorId: null,
          guestEditorId: null,
          status: 'SUBMITTED',
        },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      authors: true,
      editor: true,
      guestEditor: true,
      assignedBy: true,
      reviews: {
        include: {
          reviewer: true,
        },
      },
    },
  });

  // Query approved reviewers
  const reviewers = await prisma.user.findMany({
    where: { role: Role.REVIEWER, isActive: true },
    include: { reviewerProfile: true },
  });

  // Query guest editors
  const guestEditors = await prisma.user.findMany({
    where: { role: Role.GUEST_EDITOR },
  });

  // Stats
  const totalAssigned = papers.length;
  const underReviewCount = papers.filter((p) => p.status === 'UNDER_REVIEW').length;
  const awaitingDecision = papers.filter(
    (p) => p.status === 'UNDER_REVIEW' && p.reviews.some((r) => r.status === 'COMPLETED')
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
          {t('common.dashboard')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Coordinate peer reviews, assign reviewers, track guest editors, and make recommendations.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Assigned Manuscripts
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssigned}</div>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Currently Under Review
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500 animate-spin-slow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{underReviewCount}</div>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Reviews Received
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{awaitingDecision}</div>
          </CardContent>
        </Card>
      </div>

      {/* Papers Section */}
      <div>
        <h3 className="text-lg font-bold tracking-tight mb-4">{t('dashboards.editor.myPapers')}</h3>
        <EditorPapersList papers={papers} reviewers={reviewers} guestEditors={guestEditors} />
      </div>
    </div>
  );
}
