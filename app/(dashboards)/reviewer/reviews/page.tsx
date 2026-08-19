import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ReviewerTaskList } from '@/components/reviewer-task-list';
import { Role } from '@prisma/client';

export default async function ReviewerReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.REVIEWER) {
    redirect('/login');
  }

  // Query reviews assigned to this reviewer
  const reviews = await prisma.review.findMany({
    where: { reviewerId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      submission: true,
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
          Assigned Review Tasks
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Access manuscripts assigned to you for peer evaluation, submit correction requests, and log recommendations.
        </p>
      </div>

      <ReviewerTaskList reviews={reviews} />
    </div>
  );
}
