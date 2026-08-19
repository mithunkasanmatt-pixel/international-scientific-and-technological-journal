'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Fetch notifications for the currently logged-in user.
 */
export async function getUserNotifications() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: 'Unauthorized.' };
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, notifications };
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

/**
 * Mark a specific notification as read.
 */
export async function markNotificationRead(notificationId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: 'Unauthorized.' };
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== session.user.id) {
      return { error: 'Notification not found.' };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

/**
 * Mark all notifications for the current user as read.
 */
export async function markAllNotificationsRead() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: 'Unauthorized.' };
  }

  try {
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: { read: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return { error: 'An unexpected error occurred.' };
  }
}
