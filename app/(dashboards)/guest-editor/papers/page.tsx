import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EditorPapersList } from '@/components/editor-papers-list';
import { Role } from '@prisma/client';

export default async function GuestEditorPapersPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.GUEST_EDITOR) {
    redirect('/login');
  }

  // Query submissions assigned to this Guest Editor
  const papers = await prisma.submission.findMany({
    where: { guestEditorId: session.user.id },
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
          Delegated Manuscripts
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review delegated articles, invite peer reviewers, and submit recommendations.
        </p>
      </div>

      <EditorPapersList papers={papers} reviewers={reviewers} guestEditors={[]} isGuestEditor={true} />
    </div>
  );
}
