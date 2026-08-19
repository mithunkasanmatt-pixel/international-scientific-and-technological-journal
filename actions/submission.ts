'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getNextPaperId } from '@/services/sequence';
import { storageService } from '@/services/storage';
import { PaperType, SubmissionStatus } from '@prisma/client';
import { mailService } from '@/services/mail';
import { createAndSendNotification } from '@/services/notification';

interface CoAuthorInput {
  name: string;
  email: string;
  orcid?: string;
  isCorresponding: boolean;
}

export async function submitPaper(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== 'AUTHOR') {
    return { error: 'Unauthorized. Only authors can submit papers.' };
  }

  const title = formData.get('title') as string;
  const abstract = formData.get('abstract') as string;
  const paperType = formData.get('paperType') as PaperType;
  const keywords = formData.get('keywords') as string;
  const primaryDomain = formData.get('primaryDomain') as string;
  const secondaryDomain = formData.get('secondaryDomain') as string;
  const country = formData.get('country') as string;
  const journalReference = formData.get('journalReference') as string;
  const agreement = formData.get('agreement') === 'true';

  const manuscriptFile = formData.get('manuscript') as File;
  const coverLetterFile = formData.get('coverLetter') as File;
  const supportingFile = formData.get('supportingFiles') as File;

  const authorsJson = formData.get('authors') as string;

  if (!title || !abstract || !paperType || !keywords || !primaryDomain || !country || !agreement) {
    return { error: 'Please fill all mandatory fields and agree to the guidelines.' };
  }

  if (!manuscriptFile || manuscriptFile.size === 0) {
    return { error: 'Please upload the main manuscript file.' };
  }

  let coAuthors: CoAuthorInput[] = [];
  try {
    coAuthors = JSON.parse(authorsJson || '[]');
  } catch (err) {
    return { error: 'Invalid authors list format.' };
  }

  if (coAuthors.length === 0) {
    return { error: 'Please add at least one author.' };
  }

  const hasCorresponding = coAuthors.some((auth) => auth.isCorresponding && auth.email);
  if (!hasCorresponding) {
    return { error: 'A corresponding author with a valid email is required.' };
  }

  try {
    // Upload files
    const manuscriptUrl = await storageService.uploadFile(manuscriptFile, 'manuscripts');
    let coverLetterUrl = '';
    if (coverLetterFile && coverLetterFile.size > 0) {
      coverLetterUrl = await storageService.uploadFile(coverLetterFile, 'coverletters');
    }
    let supportingUrl = '';
    if (supportingFile && supportingFile.size > 0) {
      supportingUrl = await storageService.uploadFile(supportingFile, 'supporting');
    }

    // Generate unique sequential Paper ID
    const paperId = await getNextPaperId();

    // Database save transaction
    const submission = await prisma.$transaction(async (tx) => {
      const sub = await tx.submission.create({
        data: {
          paperId,
          title,
          abstract,
          paperType,
          status: SubmissionStatus.SUBMITTED,
          fileUrl: manuscriptUrl,
          coverLetterUrl: coverLetterUrl || null,
          supportingFilesUrl: supportingUrl || null,
          keywords,
          primaryDomain,
          secondaryDomain: secondaryDomain || null,
          country,
          journalReference: journalReference || null,
          submitterId: session.user.id,
        },
      });

      // Save co-authors
      await tx.submissionAuthor.createMany({
        data: coAuthors.map((auth) => ({
          submissionId: sub.id,
          name: auth.name,
          email: auth.email.toLowerCase(),
          orcid: auth.orcid || null,
          isCorresponding: auth.isCorresponding,
        })),
      });

      // Log status change on timeline
      await tx.timelineEvent.create({
        data: {
          submissionId: sub.id,
          status: SubmissionStatus.SUBMITTED,
          actorId: session.user.id,
          actorName: session.user.name || 'Author',
          comments: 'Initial submission of manuscript.',
        },
      });

      // System Activity Audit Log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          submissionId: sub.id,
          action: 'PAPER_SUBMISSION',
          details: `Paper submitted with sequential ID ${paperId}`,
        },
      });

      return sub;
    });

    // Notify Author (submitter)
    await createAndSendNotification({
      userId: session.user.id,
      title: 'Manuscript Submitted Successfully',
      message: `Thank you. Your manuscript "${title}" (ID: ${paperId}) has been submitted successfully to the editorial office.`,
      paperId,
    });

    // Notify Chief Editor
    const chiefEditor = await prisma.user.findFirst({
      where: { role: 'CHIEF_EDITOR' },
    });
    if (chiefEditor) {
      await createAndSendNotification({
        userId: chiefEditor.id,
        title: 'New Manuscript Submitted',
        message: `A new manuscript titled "${title}" (ID: ${paperId}) has been submitted by author ${session.user.name}.`,
        paperId,
      });
    }

    // Notify corresponding author if different
    const corresponding = coAuthors.find((auth) => auth.isCorresponding);
    if (corresponding && corresponding.email.toLowerCase() !== session.user.email?.toLowerCase()) {
      // Check if they are a registered user
      const corrUser = await prisma.user.findFirst({
        where: { email: corresponding.email.toLowerCase() },
      });
      if (corrUser) {
        await createAndSendNotification({
          userId: corrUser.id,
          title: 'Listed as Corresponding Author',
          message: `You have been listed as the corresponding author for the manuscript titled "${title}" (ID: ${paperId}) submitted by ${session.user.name}.`,
          paperId,
        });
      } else {
        // Fallback to just email
        await mailService.sendWorkflowUpdate(
          corresponding.email,
          paperId,
          title,
          'Submitted',
          `You have been listed as the corresponding author for the manuscript titled "${title}" submitted to our journal.`
        );
      }
    }

    return { success: true, paperId };
  } catch (error) {
    console.error('Submission error:', error);
    return { error: 'An error occurred during submission. Please try again.' };
  }
}

// Resubmit Revised Paper
export async function resubmitPaperRevision(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== 'AUTHOR') {
    return { error: 'Unauthorized.' };
  }

  const submissionId = formData.get('submissionId') as string;
  const manuscriptFile = formData.get('manuscript') as File;
  const responseLetterFile = formData.get('responseLetter') as File;
  const comments = formData.get('comments') as string;

  if (!submissionId || !manuscriptFile || manuscriptFile.size === 0 || !responseLetterFile || responseLetterFile.size === 0) {
    return { error: 'Both revised manuscript and response letter files are required.' };
  }

  try {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!sub || sub.submitterId !== session.user.id) {
      return { error: 'Submission not found.' };
    }

    if (sub.status !== SubmissionStatus.REVISION_REQUIRED) {
      return { error: 'Revisions are not currently requested for this paper.' };
    }

    const manuscriptUrl = await storageService.uploadFile(manuscriptFile, 'revisions');
    const responseLetterUrl = await storageService.uploadFile(responseLetterFile, 'response_letters');

    await prisma.$transaction(async (tx) => {
      // Update paper status and urls
      await tx.submission.update({
        where: { id: submissionId },
        data: {
          fileUrl: manuscriptUrl,
          responseLetterUrl: responseLetterUrl,
          status: SubmissionStatus.RESUBMITTED,
        },
      });

      // Save event
      await tx.timelineEvent.create({
        data: {
          submissionId,
          status: SubmissionStatus.RESUBMITTED,
          actorId: session.user.id,
          actorName: session.user.name || 'Author',
          comments: comments || 'Revised manuscript and response letter submitted by Author.',
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          submissionId,
          action: 'PAPER_RESUBMISSION',
          details: `Revised manuscript uploaded for paper ${sub.paperId}`,
        },
      });
    });

    // Notify Author
    await createAndSendNotification({
      userId: session.user.id,
      title: 'Revision Resubmitted',
      message: `Your revised manuscript for "${sub.title}" (ID: ${sub.paperId}) has been successfully uploaded and is awaiting editor review.`,
      paperId: sub.paperId,
    });

    // Notify Editor if assigned, otherwise Chief Editor
    if (sub.editorId) {
      await createAndSendNotification({
        userId: sub.editorId,
        title: 'Revised Paper Uploaded',
        message: `The author of paper "${sub.title}" (ID: ${sub.paperId}) has uploaded a revised manuscript.`,
        paperId: sub.paperId,
      });
    } else {
      const chief = await prisma.user.findFirst({
        where: { role: 'CHIEF_EDITOR' },
      });
      if (chief) {
        await createAndSendNotification({
          userId: chief.id,
          title: 'Revised Paper Uploaded',
          message: `The author of paper "${sub.title}" (ID: ${sub.paperId}) has uploaded a revised manuscript.`,
          paperId: sub.paperId,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Revision upload error:', error);
    return { error: 'An error occurred during upload.' };
  }
}

// Edit Submitted Paper Metadata (restricted to unassigned only)
export async function editPaper(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== 'AUTHOR') {
    return { error: 'Unauthorized.' };
  }

  const submissionId = formData.get('submissionId') as string;
  const title = formData.get('title') as string;
  const abstract = formData.get('abstract') as string;
  const paperType = formData.get('paperType') as PaperType;
  const keywords = formData.get('keywords') as string;
  const primaryDomain = formData.get('primaryDomain') as string;
  const secondaryDomain = formData.get('secondaryDomain') as string;
  const country = formData.get('country') as string;
  const journalReference = formData.get('journalReference') as string;

  if (!submissionId || !title || !abstract || !paperType || !keywords || !primaryDomain || !country) {
    return { error: 'Please fill all mandatory fields.' };
  }

  try {
    const sub = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!sub || sub.submitterId !== session.user.id) {
      return { error: 'Submission not found.' };
    }

    // Once the paper has been assigned to any user, the Edit option should be disabled and no longer work
    const isAssigned = sub.editorId !== null || sub.guestEditorId !== null || (sub.status !== SubmissionStatus.SUBMITTED && sub.status !== SubmissionStatus.DRAFT);
    if (isAssigned) {
      return { error: 'This manuscript has already been assigned and cannot be edited.' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id: submissionId },
        data: {
          title,
          abstract,
          paperType,
          keywords,
          primaryDomain,
          secondaryDomain: secondaryDomain || null,
          country,
          journalReference: journalReference || null,
        },
      });

      // Log timeline event
      await tx.timelineEvent.create({
        data: {
          submissionId,
          status: sub.status,
          actorId: session.user.id,
          actorName: session.user.name || 'Author',
          comments: 'Author edited manuscript metadata.',
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          submissionId,
          action: 'PAPER_EDIT',
          details: `Paper metadata edited for paper ${sub.paperId}`,
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Edit paper error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}
