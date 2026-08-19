'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Role, ReviewerStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { mailService } from '@/services/mail';
import { createAndSendNotification } from '@/services/notification';

// 1. Toggle User Active Status
export async function toggleUserStatus(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== Role.ADMIN) {
    return { error: 'Unauthorized.' };
  }

  const userId = formData.get('userId') as string;

  if (!userId) {
    return { error: 'User ID is required.' };
  }

  if (userId === session.user.id) {
    return { error: 'You cannot deactivate your own admin account.' };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { error: 'User not found.' };
    }

    const nextStatus = !user.isActive;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: nextStatus },
      });

      // Audit Log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: nextStatus ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
          details: `Changed active status of user ${user.email} to ${nextStatus}`,
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Toggle status error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

// 2. Change User Role
export async function changeUserRole(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== Role.ADMIN) {
    return { error: 'Unauthorized.' };
  }

  const userId = formData.get('userId') as string;
  const newRole = formData.get('role') as Role;

  if (!userId || !newRole) {
    return { error: 'Missing user ID or role.' };
  }

  if (userId === session.user.id) {
    return { error: 'You cannot change your own admin role.' };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { error: 'User not found.' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { role: newRole },
      });

      // Audit Log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: 'USER_ROLE_CHANGED',
          details: `Changed role of user ${user.email} from ${user.role} to ${newRole}`,
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Role change error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

// 3. Admin Direct User Registration
export async function adminCreateUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || session.user.role !== Role.ADMIN) {
    return { error: 'Unauthorized.' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as Role;

  if (!name || !email || !password || !role) {
    return { error: 'All fields are required.' };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: {
        email_role: {
          email: email.toLowerCase(),
          role,
        },
      },
    });
    if (existing) {
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
          isActive: true,
        },
      });

      if (role === Role.REVIEWER) {
        await tx.reviewerProfile.create({
          data: {
            userId: u.id,
            institution: 'N/A',
            domains: 'N/A',
            status: ReviewerStatus.APPROVED,
          },
        });
      }

      // Audit Log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: 'USER_CREATED_BY_ADMIN',
          details: `Admin created new account: ${email} with role ${role}`,
        },
      });

      return u;
    });

    // Send welcome email & in-app notification
    await mailService.sendWelcomeEmail(user.email, user.name, password);
    await createAndSendNotification({
      userId: user.id,
      title: 'Welcome to Journal Publishing System',
      message: `Dear ${user.name}, your account has been created by the administrator with role ${role}. Your username is ${user.email}.`,
    });

    return { success: true };
  } catch (error) {
    console.error('Admin create user error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}
