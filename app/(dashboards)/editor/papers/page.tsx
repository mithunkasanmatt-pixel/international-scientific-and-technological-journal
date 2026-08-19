import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EditorPapersList } from '@/components/editor-papers-list';
import { Role } from '@prisma/client';

export default async function EditorPapersPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || session.user.role !== Role.EDITOR) {
    redirect('/login');
  }

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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
          Assigned Manuscripts
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage assigned review workflows: invite reviewers, track progress, and submit recommendations.
        </p>
      </div>

      <EditorPapersList papers={papers} reviewers={reviewers} guestEditors={guestEditors} />
    </div>
  );
}
