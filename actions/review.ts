'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { storageService } from '@/services/storage';
import { Recommendation, ReviewStatus, SubmissionStatus } from '@prisma/client';
import { mailService } from '@/services/mail';
import { createAndSendNotification } from '@/services/notification';

export async function submitReview(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== 'REVIEWER') {
    return { error: 'Unauthorized. Only reviewers can submit reviews.' };
  }

  const reviewId = formData.get('reviewId') as string;
  const comments = formData.get('comments') as string;
  const mistakes = formData.get('mistakes') as string;
  const recommendation = formData.get('recommendation') as Recommendation;
  const annotatedFile = formData.get('annotatedFile') as File;

  if (!reviewId || !comments || !mistakes || !recommendation) {
    return { error: 'All fields are required.' };
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        submission: true,
      },
    });

    if (!review || review.reviewerId !== session.user.id) {
      return { error: 'Review task not found.' };
    }

    if (review.status === ReviewStatus.COMPLETED) {
      return { error: 'This review has already been submitted.' };
    }

    // Upload file if present
    let fileUrl = '';
    if (annotatedFile && annotatedFile.size > 0) {
      fileUrl = await storageService.uploadFile(annotatedFile, 'annotated_manuscripts');
    }

    // Database update in transaction
    await prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: {
          comments,
          mistakes,
          recommendation,
          fileUrl: fileUrl || null,
          status: ReviewStatus.COMPLETED,
        },
      });

      // Check if all reviews for this paper are completed
      const allReviews = await tx.review.findMany({
        where: { submissionId: review.submissionId },
      });

      const allCompleted = allReviews.every(
        (r) => r.id === reviewId ? true : r.status === ReviewStatus.COMPLETED
      );

      let finalPaperStatus = review.submission.status;
      if (allCompleted) {
        finalPaperStatus = SubmissionStatus.REVIEWS_COMPLETED;
        await tx.submission.update({
          where: { id: review.submissionId },
          data: { status: SubmissionStatus.REVIEWS_COMPLETED },
        });
      }

      // Log review completion on timeline
      await tx.timelineEvent.create({
        data: {
          submissionId: review.submissionId,
          status: finalPaperStatus,
          actorId: session.user.id,
          actorName: `Reviewer (${session.user.name})`,
          comments: `Peer review completed. Recommendation: ${recommendation}.${allCompleted ? ' All reviews completed.' : ''}`,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          submissionId: review.submissionId,
          action: 'REVIEW_COMPLETED',
          details: `Review submitted for paper ${review.submission.paperId}${allCompleted ? ' (All reviews completed)' : ''}`,
        },
      });
    });

    // Notify assigned Editor or Chief Editor
    let recipientId = review.submission.editorId;
    if (!recipientId) {
      const chief = await prisma.user.findFirst({
        where: { role: 'CHIEF_EDITOR' },
      });
      recipientId = chief?.id || null;
    }

    if (recipientId) {
      await createAndSendNotification({
        userId: recipientId,
        title: 'Review Completed',
        message: `Reviewer ${session.user.name} has submitted an evaluation report for paper "${review.submission.title}" (ID: ${review.submission.paperId}).`,
        paperId: review.submission.paperId,
      });
    }

    // Also notify Reviewer confirming submission of report
    await createAndSendNotification({
      userId: session.user.id,
      title: 'Review Report Submitted',
      message: `Thank you for submitting your evaluation report for paper "${review.submission.title}" (ID: ${review.submission.paperId}).`,
      paperId: review.submission.paperId,
    });

    return { success: true };
  } catch (error) {
    console.error('Review submission error:', error);
    return { error: 'An unexpected error occurred during submission.' };
  }
}
