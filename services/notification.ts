import { prisma } from '@/lib/prisma';
import { mailService } from '@/services/mail';

export interface NotificationOptions {
  userId: string;
  title: string;
  message: string;
  paperId?: string;
}

/**
 * Creates an in-app notification in the database and sends a corresponding email.
 */
export async function createAndSendNotification(options: NotificationOptions) {
  try {
    // 1. Create in-app notification record
    const notification = await prisma.notification.create({
      data: {
        userId: options.userId,
        title: options.title,
        message: options.message,
        paperId: options.paperId || null,
      },
    });

    // 2. Fetch recipient details
    const user = await prisma.user.findUnique({
      where: { id: options.userId },
      select: { email: true, name: true },
    });

    if (user && user.email) {
      // 3. Dispatch email
      if (options.paperId) {
        await mailService.sendWorkflowUpdate(
          user.email,
          options.paperId,
          options.title, // Paper title or subject
          options.title, // Status title
          options.message
        );
      } else {
        await mailService.sendEmail({
          to: user.email,
          subject: options.title,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #1a365d;">${options.title}</h2>
              <p>Dear ${user.name},</p>
              <p>${options.message}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #718096;">This is an automated system email. Please do not reply directly.</p>
            </div>
          `,
        });
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating/sending notification:', error);
  }
}
