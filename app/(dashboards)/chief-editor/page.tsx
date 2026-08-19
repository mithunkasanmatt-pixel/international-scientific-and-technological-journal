import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ChiefPapersList } from '@/components/chief-papers-list';
import { Role, ReviewerStatus } from '@prisma/client';

export default async function ChiefEditorDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.CHIEF_EDITOR) {
    redirect('/login');
  }

  // Query all submissions in the system
  const papers = await prisma.submission.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      submitter: true,
      editor: true,
      guestEditor: true,
      reviews: {
        include: {
          reviewer: true,
        },
      },
    },
  });

  // Query all editors (including chief editors and guest editors)
  const editors = await prisma.user.findMany({
    where: {
      role: {
        in: [Role.EDITOR, Role.CHIEF_EDITOR, Role.GUEST_EDITOR],
      },
    },
  });

  // Query active reviewers
  const reviewers = await prisma.user.findMany({
    where: { role: Role.REVIEWER, isActive: true },
    include: { reviewerProfile: true },
  });

  // Query pending reviewer applications
  const pendingReviewers = await prisma.reviewerProfile.findMany({
    where: { status: ReviewerStatus.PENDING },
    include: { user: true },
  });

  return (
    <ChiefPapersList
      papers={papers}
      editors={editors}
      reviewers={reviewers}
      pendingReviewers={pendingReviewers}
      chiefUserId={session.user.id}
    />
  );
}
