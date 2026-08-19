'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubmissionStatus, ReviewStatus, Role } from '@prisma/client';
import { mailService } from '@/services/mail';
import { createAndSendNotification } from '@/services/notification';

// 1. Assign Reviewer
export async function assignReviewerToPaper(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: 'Unauthorized.' };
  }

  // Check roles: Chief Editor, Editor or Guest Editor can assign reviewers
  const isAuthorized = (
    session.user.role === Role.CHIEF_EDITOR ||
    session.user.role === Role.EDITOR ||
    session.user.role === Role.GUEST_EDITOR
  );
  if (!isAuthorized) {
    return { error: 'Forbidden. You do not have authority to assign reviewers.' };
  }

  const submissionId = formData.get('submissionId') as string;
  const reviewerId = formData.get('reviewerId') as string;

  if (!submissionId || !reviewerId) {
    return { error: 'Missing paper or reviewer selection.' };
  }

  try {
    const reviewer = await prisma.user.findUnique({
      where: { id: reviewerId },
      include: { reviewerProfile: true },
    });

    if (!reviewer || reviewer.role !== Role.REVIEWER || !reviewer.isActive) {
      return { error: 'Invalid or unapproved reviewer.' };
    }

    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!sub) {
      return { error: 'Manuscript not found.' };
    }

    // Verify ownership
    if (session.user.role === Role.EDITOR) {
      const isUnassigned = sub.editorId === null && sub.guestEditorId === null;
      const isAssignedToSelf = sub.editorId === session.user.id;
      if (!isUnassigned && !isAssignedToSelf) {
        return { error: 'Forbidden. You are not assigned to this paper.' };
      }
    } else if (session.user.role === Role.GUEST_EDITOR) {
      if (sub.guestEditorId !== session.user.id) {
        return { error: 'Forbidden. You are not assigned as the Guest Editor for this paper.' };
      }
    }

    // Check if already assigned
    const existing = await prisma.review.findFirst({
      where: { submissionId, reviewerId },
    });

    if (existing) {
      return { error: 'This reviewer is already assigned to this paper.' };
    }

    await prisma.$transaction(async (tx) => {
      // Create pending review task
      await tx.review.create({
        data: {
          submissionId,
          reviewerId,
          comments: '',
          mistakes: '',
          recommendation: 'ACCEPT', // Default placeholder
          status: ReviewStatus.PENDING,
        },
      });

      const subUpdateData: any = {
        status: SubmissionStatus.UNDER_REVIEW,
      };

      if (session.user.role === Role.EDITOR && sub.editorId === null) {
        subUpdateData.editorId = session.user.id;
        subUpdateData.assignedById = session.user.id;
      } else if (session.user.role === Role.CHIEF_EDITOR) {
        if (sub.editorId === null && sub.guestEditorId === null) {
          subUpdateData.editorId = session.user.id;
        }
        if (sub.assignedById === null) {
          subUpdateData.assignedById = session.user.id;
        }
      }

      // Update paper status to UNDER_REVIEW
      await tx.submission.update({
        where: { id: submissionId },
        data: subUpdateData,
      });

      // Log event
      await tx.timelineEvent.create({
        data: {
          submissionId,
          status: SubmissionStatus.UNDER_REVIEW,
          actorId: session.user.id,
          actorName: session.user.name || 'Editor',
          comments: `Assigned reviewer: ${reviewer.name}. Paper moved to Under Review.`,
        },
      });

      // Audit log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          submissionId,
          action: 'REVIEWER_ASSIGNED',
          details: `Reviewer ${reviewer.email} assigned to paper ${sub.paperId}`,
        },
      });
    });

    // Notify reviewer
    await createAndSendNotification({
      userId: reviewerId,
      title: 'Review Assignment',
      message: `You have been assigned to review the manuscript "${sub.title}" (ID: ${sub.paperId}). Please log in to complete your report.`,
      paperId: sub.paperId,
    });

    // Notify Author
    await createAndSendNotification({
      userId: sub.submitterId,
      title: 'Manuscript Under Review',
      message: `Your manuscript "${sub.title}" (ID: ${sub.paperId}) is now under peer review.`,
      paperId: sub.paperId,
    });

    return { success: true };
  } catch (error) {
    console.error('Reviewer assignment error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

// 2. Delegate to Guest Editor
export async function delegateToGuestEditor(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: 'Unauthorized.' };
  }

  // Chief Editor or assigned Editor can delegate
  const isAuthorized = (
    session.user.role === Role.CHIEF_EDITOR ||
    session.user.role === Role.EDITOR
  );
  if (!isAuthorized) {
    return { error: 'Forbidden.' };
  }

  const submissionId = formData.get('submissionId') as string;
  const guestEditorId = formData.get('guestEditorId') as string;

  if (!submissionId || !guestEditorId) {
    return { error: 'Missing paper or guest editor.' };
  }

  try {
    const guestEditor = await prisma.user.findUnique({
      where: { id: guestEditorId },
    });

    if (!guestEditor || guestEditor.role !== Role.GUEST_EDITOR) {
      return { error: 'Invalid Guest Editor selected.' };
    }

    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!sub) {
      return { error: 'Manuscript not found.' };
    }

    if (session.user.role === Role.EDITOR) {
      const isUnassigned = sub.editorId === null && sub.guestEditorId === null;
      const isAssignedToSelf = sub.editorId === session.user.id;
      if (!isUnassigned && !isAssignedToSelf) {
        return { error: 'You are not assigned as the editor for this paper.' };
      }
    }

    await prisma.$transaction(async (tx) => {
      const subUpdateData: any = {
        guestEditorId,
      };

      if (session.user.role === Role.EDITOR && sub.editorId === null) {
        subUpdateData.editorId = session.user.id;
        subUpdateData.assignedById = session.user.id;
      } else if (session.user.role === Role.CHIEF_EDITOR && sub.assignedById === null) {
        subUpdateData.assignedById = session.user.id;
      }

      await tx.submission.update({
        where: { id: submissionId },
        data: subUpdateData,
      });

      await tx.timelineEvent.create({
        data: {
          submissionId,
          status: sub.status,
          actorId: session.user.id,
          actorName: session.user.name || 'Editor',
          comments: `Paper delegated to Guest Editor: ${guestEditor.name}`,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          submissionId,
          action: 'GUEST_EDITOR_ASSIGNED',
          details: `Guest Editor ${guestEditor.email} assigned to paper ${sub.paperId}`,
        },
      });
    });

    // Notify Guest Editor
    await createAndSendNotification({
      userId: guestEditorId,
      title: 'Paper Delegated',
      message: `You have been assigned as the Guest Editor for the manuscript "${sub.title}" (ID: ${sub.paperId}). Please log in to manage its review workflow.`,
      paperId: sub.paperId,
    });

    // Notify Chief Editor
    const chiefEditor = await prisma.user.findFirst({
      where: { role: Role.CHIEF_EDITOR },
    });
    if (chiefEditor) {
      await createAndSendNotification({
        userId: chiefEditor.id,
        title: 'Paper Delegated to Guest Editor',
        message: `Manuscript "${sub.title}" (ID: ${sub.paperId}) has been delegated to Guest Editor ${guestEditor.name} by Editor ${session.user.name}.`,
        paperId: sub.paperId,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Guest editor delegation error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

// 3. Forward Editor Recommendation to Chief Editor
export async function forwardEditorRecommendation(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: 'Unauthorized.' };
  }

  const isAuthorized = (
    session.user.role === Role.EDITOR ||
    session.user.role === Role.GUEST_EDITOR
  );
  if (!isAuthorized) {
    return { error: 'Forbidden.' };
  }

  const submissionId = formData.get('submissionId') as string;
  const recommendation = formData.get('recommendation') as string; // ACCEPT, REJECT, REVISION_REQUIRED
  const comments = formData.get('comments') as string;

  if (!submissionId || !recommendation || !comments) {
    return { error: 'All fields are required.' };
  }

  try {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!sub) {
      return { error: 'Manuscript not found.' };
    }

    await prisma.$transaction(async (tx) => {
      // Log recommendation on timeline
      await tx.timelineEvent.create({
        data: {
          submissionId,
          status: sub.status,
          actorId: session.user.id,
          actorName: `${session.user.role === Role.GUEST_EDITOR ? 'Guest Editor' : 'Editor'} (${session.user.name})`,
          comments: `Recommendation submitted to Chief Editor: ${recommendation}. Remarks: ${comments}`,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          submissionId,
          action: 'EDITOR_RECOMMENDATION',
          details: `Recommendation: ${recommendation} forwarded for paper ${sub.paperId}`,
        },
      });
    });

    // Notify Chief Editor
    const chiefEditor = await prisma.user.findFirst({
      where: { role: Role.CHIEF_EDITOR },
    });

    if (chiefEditor) {
      await createAndSendNotification({
        userId: chiefEditor.id,
        title: 'Editor Recommendation Submitted',
        message: `Editor ${session.user.name} has submitted an editorial recommendation for paper "${sub.title}" (ID: ${sub.paperId}): "${recommendation}".\n\nRemarks:\n${comments}`,
        paperId: sub.paperId,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Forward recommendation error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

// 4. Make Final Decision by Editor/Guest Editor
export async function makeEditorDecision(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: 'Unauthorized.' };
  }

  const isAuthorized = (
    session.user.role === Role.CHIEF_EDITOR ||
    session.user.role === Role.EDITOR ||
    session.user.role === Role.GUEST_EDITOR
  );
  if (!isAuthorized) {
    return { error: 'Forbidden.' };
  }

  const submissionId = formData.get('submissionId') as string;
  const decision = formData.get('decision') as SubmissionStatus; // ACCEPTED, REJECTED, REVISION_REQUIRED
  const comments = formData.get('comments') as string;

  if (!submissionId || !decision || !comments) {
    return { error: 'All fields are required.' };
  }

  try {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { submitter: true },
    });

    if (!sub) {
      return { error: 'Manuscript not found.' };
    }

    // Verify ownership
    if (session.user.role === Role.EDITOR && sub.editorId !== session.user.id) {
      return { error: 'You are not assigned as the editor for this paper.' };
    }
    if (session.user.role === Role.GUEST_EDITOR && sub.guestEditorId !== session.user.id) {
      return { error: 'You are not assigned as the guest editor for this paper.' };
    }

    await prisma.$transaction(async (tx) => {
      // Update paper status
      await tx.submission.update({
        where: { id: submissionId },
        data: { status: decision },
      });

      // Log timeline
      await tx.timelineEvent.create({
        data: {
          submissionId,
          status: decision,
          actorId: session.user.id,
          actorName: `${session.user.role === Role.GUEST_EDITOR ? 'Guest Editor' : 'Editor'} (${session.user.name})`,
          comments: `Editorial decision: ${decision}. Remarks: ${comments}`,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          submissionId,
          action: 'EDITOR_DECISION',
          details: `Editorial decision ${decision} by ${session.user.role} for paper ${sub.paperId}`,
        },
      });
    });

    // Notify Author
    await createAndSendNotification({
      userId: sub.submitterId,
      title: `Editorial Decision: ${decision}`,
      message: `An editorial decision has been made for your manuscript "${sub.title}" (ID: ${sub.paperId}).\n\nDecision: ${decision}\n\nRemarks:\n${comments}`,
      paperId: sub.paperId,
    });

    // Notify Chief Editor
    const chiefEditor = await prisma.user.findFirst({
      where: { role: Role.CHIEF_EDITOR },
    });
    if (chiefEditor) {
      await createAndSendNotification({
        userId: chiefEditor.id,
        title: `Editorial Decision: ${decision}`,
        message: `An editorial decision of "${decision}" has been made for manuscript "${sub.title}" (ID: ${sub.paperId}) by ${session.user.role === Role.GUEST_EDITOR ? 'Guest Editor' : 'Editor'} ${session.user.name}.`,
        paperId: sub.paperId,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Editor decision error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

// 5. Self Assign Paper
export async function assignSelfToPaper(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== Role.EDITOR) {
    return { error: 'Unauthorized. Only editors can self-assign.' };
  }

  const submissionId = formData.get('submissionId') as string;
  if (!submissionId) {
    return { error: 'Missing submission ID.' };
  }

  try {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!sub) {
      return { error: 'Manuscript not found.' };
    }

    if (sub.editorId !== null || sub.guestEditorId !== null) {
      return { error: 'Manuscript is already assigned.' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id: submissionId },
        data: {
          editorId: session.user.id,
          assignedById: session.user.id,
          status: SubmissionStatus.ASSIGNED,
        },
      });

      // Log event
      await tx.timelineEvent.create({
        data: {
          submissionId,
          status: SubmissionStatus.ASSIGNED,
          actorId: session.user.id,
          actorName: session.user.name || 'Editor',
          comments: `Editor self-assigned the paper.`,
        },
      });

      // Audit log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          submissionId,
          action: 'EDITOR_SELF_ASSIGNED',
          details: `Editor self-assigned paper ${sub.paperId}`,
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Self assignment error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}
