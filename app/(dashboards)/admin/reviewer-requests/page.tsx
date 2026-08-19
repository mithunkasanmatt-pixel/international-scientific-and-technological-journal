import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ReviewerApprovalsList } from '@/components/reviewer-approvals-list';
import { Role, ReviewerStatus } from '@prisma/client';

export default async function AdminReviewerRequestsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.ADMIN) {
    redirect('/login');
  }

  // Fetch pending reviewer registrations
  const pendingReviewers = await prisma.reviewerProfile.findMany({
    where: { status: ReviewerStatus.PENDING },
    include: { user: true },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-primary">
          Pending Reviewer Registrations
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Evaluate academic expertise and approve or reject reviewer applications.
        </p>
      </div>

      <ReviewerApprovalsList pendingReviewers={pendingReviewers} />
    </div>
  );
}
