'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role, ReviewerStatus, SubmissionStatus } from '@prisma/client';
import { mailService } from '@/services/mail';
import { createAndSendNotification } from '@/services/notification';
import bcrypt from 'bcryptjs';

// 1. Approve / Reject Reviewer Registration
export async function handleReviewerRegistration(formData: FormData) {
  const session = await getServerSession(authOptions);
  const isAuthorized = session?.user?.role === Role.CHIEF_EDITOR || session?.user?.role === Role.ADMIN;
  if (!isAuthorized) {
    return { error: 'Unauthorized.' };
  }

  const profileId = formData.get('profileId') as string;
  const action = formData.get('action') as 'APPROVE' | 'REJECT';

  if (!profileId || !action) {
    return { error: 'Missing profile ID or action.' };
  }

  try {
    const profile = await prisma.reviewerProfile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });

    if (!profile) {
      return { error: 'Reviewer profile not found.' };
    }

    await prisma.$transaction(async (tx) => {
      if (action === 'APPROVE') {
        await tx.reviewerProfile.update({
          where: { id: profileId },
          data: { status: ReviewerStatus.APPROVED },
        });

        await tx.user.update({
          where: { id: profile.userId },
          data: { isActive: true },
        });

        // Log activity
        await tx.activityLog.create({
          data: {
            userId: session.user.id,
            userEmail: session.user.email,
            action: 'REVIEWER_APPROVED',
            details: `Approved reviewer registration for ${profile.user.email}`,
          },
        });
      } else {
        await tx.reviewerProfile.update({
          where: { id: profileId },
          data: { status: ReviewerStatus.REJECTED },
        });

        await tx.user.update({
          where: { id: profile.userId },
          data: { isActive: false },
        });

        // Log activity
        await tx.activityLog.create({
          data: {
            userId: session.user.id,
            userEmail: session.user.email,
            action: 'REVIEWER_REJECTED',
            details: `Rejected reviewer registration for ${profile.user.email}`,
          },
        });
      }
    });

    // Notify reviewer by email and in-app notification
    const subject = action === 'APPROVE' ? 'Reviewer Account Activated' : 'Reviewer Account Status';
    const message =
      action === 'APPROVE'
        ? 'Congratulations! Your peer reviewer registration has been approved. You can now log in to receive review assignments.'
        : 'Thank you for your interest. Unfortunately, your peer reviewer application could not be approved at this time.';

    await createAndSendNotification({
      userId: profile.userId,
      title: subject,
      message: `Dear ${profile.user.name},\n\n${message}`,
    });

    return { success: true };
  } catch (error) {
    console.error('Reviewer approval error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

// 2. Assign Editor / Self to Paper
export async function assignEditorToPaper(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== Role.CHIEF_EDITOR) {
    return { error: 'Unauthorized.' };
  }

  const submissionId = formData.get('submissionId') as string;
  const editorId = formData.get('editorId') as string;

  if (!submissionId || !editorId) {
    return { error: 'Missing paper or editor selection.' };
  }

  try {
    const editor = await prisma.user.findUnique({
      where: { id: editorId },
    });

    if (!editor || (editor.role !== Role.EDITOR && editor.role !== Role.CHIEF_EDITOR && editor.role !== Role.GUEST_EDITOR)) {
      return { error: 'Invalid selection.' };
    }

    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!sub) {
      return { error: 'Manuscript not found.' };
    }

    const isGuest = editor.role === Role.GUEST_EDITOR;

    await prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id: submissionId },
        data: {
          editorId: isGuest ? null : editorId,
          guestEditorId: isGuest ? editorId : null,
          status: SubmissionStatus.ASSIGNED,
          assignedById: session.user.id,
        },
      });

      // Log event
      await tx.timelineEvent.create({
        data: {
          submissionId,
          status: SubmissionStatus.ASSIGNED,
          actorId: session.user.id,
          actorName: 'Chief Editor',
          comments: `Assigned Editor: ${editor.name}`,
        },
      });

      // Audit log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          submissionId,
          action: 'EDITOR_ASSIGNED',
          details: `Editor ${editor.email} assigned to paper ${sub.paperId}`,
        },
      });
    });

    // Notify Editor
    await createAndSendNotification({
      userId: editor.id,
      title: 'Editor Assignment',
      message: `You have been assigned as the editor for manuscript "${sub.title}" (ID: ${sub.paperId}). Please log in to manage this submission.`,
      paperId: sub.paperId,
    });

    // Notify Author
    await createAndSendNotification({
      userId: sub.submitterId,
      title: 'Editor Assigned to Manuscript',
      message: `Editor ${editor.name} has been assigned to manage the review process for your manuscript "${sub.title}" (ID: ${sub.paperId}).`,
      paperId: sub.paperId,
    });

    return { success: true };
  } catch (error) {
    console.error('Editor assignment error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

// 3. Make Final Decision
export async function makeFinalDecision(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== Role.CHIEF_EDITOR) {
    return { error: 'Unauthorized.' };
  }

  const submissionId = formData.get('submissionId') as string;
  const decision = formData.get('decision') as SubmissionStatus; // ACCEPTED, REJECTED, REVISION_REQUIRED, PUBLISHED
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
          actorName: 'Chief Editor',
          comments: `Final editorial decision: ${decision}. Remarks: ${comments}`,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          submissionId,
          action: 'FINAL_DECISION',
          details: `Final decision: ${decision} for paper ${sub.paperId}`,
        },
      });
    });

    // Notify Author
    await createAndSendNotification({
      userId: sub.submitterId,
      title: `Editorial Decision: ${decision}`,
      message: `Chief Editor decision has been made for your manuscript "${sub.title}" (ID: ${sub.paperId}). Decision: ${decision}.\n\nEditorial Remarks:\n${comments}`,
      paperId: sub.paperId,
    });

    // Notify Assigned Editor
    if (sub.editorId) {
      await createAndSendNotification({
        userId: sub.editorId,
        title: `Final Decision: ${decision}`,
        message: `A final decision of "${decision}" has been made by the Chief Editor for manuscript "${sub.title}" (ID: ${sub.paperId}).`,
        paperId: sub.paperId,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Final decision error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

// 4. Add Guest Editor / Associate Editor / Reviewer directly by Chief Editor
export async function addStaffUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== Role.CHIEF_EDITOR) {
    return { error: 'Unauthorized.' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as Role;
  const institution = formData.get('institution') as string;
  const domains = formData.get('domains') as string;

  if (!name || !email || !password || !role) {
    return { error: 'Missing required fields.' };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email_role: {
          email: email.toLowerCase(),
          role,
        },
      },
    });

    if (existingUser) {
      return { error: 'Email already registered with this role.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role,
          isActive: true, // Auto-approved by Chief Editor
        },
      });

      if (role === Role.REVIEWER) {
        await tx.reviewerProfile.create({
          data: {
            userId: u.id,
            institution: institution || 'N/A',
            domains: domains || 'N/A',
            status: ReviewerStatus.APPROVED,
          },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: 'STAFF_USER_ADDED',
          details: `Chief Editor added ${role}: ${u.email}`,
        },
      });

      return u;
    });

    // Send welcome email & in-app notification
    await mailService.sendWelcomeEmail(user.email, user.name, password);
    await createAndSendNotification({
      userId: user.id,
      title: 'Welcome to Journal Publishing System',
      message: `Dear ${user.name}, your account has been created by the Chief Editor with role ${role}. Your username is ${user.email}.`,
    });

    return { success: true };
  } catch (error) {
    console.error('Add staff user error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}
