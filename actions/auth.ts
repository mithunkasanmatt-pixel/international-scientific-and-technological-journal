'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Role, ReviewerStatus } from '@prisma/client';
import { mailService } from '@/services/mail';
import { createAndSendNotification } from '@/services/notification';

// 1. Author Registration
export async function registerAuthor(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { error: 'All fields are required.' };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email_role: {
          email: email.toLowerCase(),
          role: Role.AUTHOR,
        },
      },
    });

    if (existingUser) {
      return { error: 'Email already registered. Duplicate Author emails are not allowed.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: Role.AUTHOR,
        isActive: true, // Automatically approved
      },
    });

    // Send welcome email & in-app notification
    await mailService.sendWelcomeEmail(user.email, user.name, password);
    await createAndSendNotification({
      userId: user.id,
      title: 'Welcome to Journal Publishing System',
      message: `Dear ${user.name}, welcome to the system! Your author account has been created successfully. Your username is ${user.email}.`,
    });

    return { success: true };
  } catch (error) {
    console.error('Author registration error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

// 2. Reviewer Registration
export async function registerReviewer(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const institution = formData.get('institution') as string;
  const domains = formData.get('domains') as string;

  if (!name || !email || !password || !institution || !domains) {
    return { error: 'All fields are required.' };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email_role: {
          email: email.toLowerCase(),
          role: Role.REVIEWER,
        },
      },
    });

    if (existingUser) {
      return { error: 'Email already registered. Duplicate Reviewer emails are not allowed.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: Role.REVIEWER,
          isActive: false, // Inactive until approved by Chief Editor
        },
      });

      await tx.reviewerProfile.create({
        data: {
          userId: u.id,
          institution,
          domains,
          status: ReviewerStatus.PENDING,
        },
      });

      return u;
    });

    // Send welcome email & registration confirmation
    await mailService.sendWelcomeEmail(user.email, user.name, password);
    await mailService.sendReviewerRegistrationConfirmation(user.email, user.name);

    await createAndSendNotification({
      userId: user.id,
      title: 'Reviewer Application Registered',
      message: `Dear Dr. ${user.name}, thank you for registering as a peer reviewer. Your account has been registered with username ${user.email} and is pending approval.`,
    });

    return { success: true };
  } catch (error) {
    console.error('Reviewer registration error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

// 3. Request Password Reset OTP
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email is required.' };
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return success even if email is not found to prevent user enumeration security issues
      return { success: true, message: 'If the email exists, an OTP has been sent.' };
    }

    // Generate a 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins validity

    // Store in database
    await prisma.verificationToken.create({
      data: {
        email: email.toLowerCase(),
        token: otp,
        expires,
        type: 'PASSWORD_RESET',
      },
    });

    // Send OTP email
    await mailService.sendOtpEmail(user.email, otp);

    return { success: true };
  } catch (error) {
    console.error('Password reset request error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

// 4. Verify OTP and Reset Password
export async function resetPasswordWithOtp(formData: FormData) {
  const email = formData.get('email') as string;
  const otp = formData.get('otp') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!email || !otp || !newPassword) {
    return { error: 'All fields are required.' };
  }

  try {
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        email: email.toLowerCase(),
        token: otp,
        type: 'PASSWORD_RESET',
        expires: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      return { error: 'Invalid or expired OTP.' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and delete token in a transaction
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { email: email.toLowerCase() },
        data: { password: hashedPassword },
      }),
      prisma.verificationToken.delete({
        where: { id: tokenRecord.id },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return { error: 'An unexpected error occurred.' };
  }
}

// 5. Check Roles Registered with an Email
export async function checkEmailRoles(email: string) {
  if (!email) return { roles: [] };
  try {
    const users = await prisma.user.findMany({
      where: { email: email.trim().toLowerCase() },
      select: { role: true },
    });
    return { roles: users.map((u) => u.role) };
  } catch (error) {
    console.error('Check email roles error:', error);
    return { roles: [] };
  }
}
