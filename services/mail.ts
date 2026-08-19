import nodemailer from 'nodemailer';

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface MailService {
  sendEmail(options: MailOptions): Promise<boolean>;
  sendWelcomeEmail(email: string, name: string, passwordPlain: string): Promise<boolean>;
  sendOtpEmail(email: string, otp: string): Promise<boolean>;
  sendWorkflowUpdate(email: string, paperId: string, title: string, status: string, message: string): Promise<boolean>;
  sendReviewerRegistrationConfirmation(email: string, name: string): Promise<boolean>;
}

class SMTPMailService implements MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
    }
  }

  async sendEmail(options: MailOptions): Promise<boolean> {
    const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'no-reply@journal.com';

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });
        return true;
      } catch (error) {
        console.error('SMTP Mail send failed:', error);
        return false;
      }
    } else {
      console.log('--- MAIL SIMULATION (No SMTP Configured) ---');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body:\n${options.html}`);
      console.log('---------------------------------------------');
      return true;
    }
  }

  async sendWelcomeEmail(email: string, name: string, passwordPlain: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Journal Publishing System',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #1a365d;">Welcome to Journal Submission System</h2>
          <p>Dear ${name},</p>
          <p>Thank you for registering. Your author account has been created successfully.</p>
          <div style="background: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Your Credentials:</strong></p>
            <p style="margin: 0 0 5px 0;"><strong>Username / Email:</strong> ${email}</p>
            <p style="margin: 0;"><strong>Password:</strong> ${passwordPlain}</p>
          </div>
          <p>Please log in to submit your manuscript and track its review progress.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #718096;">This is an automated system email. Please do not reply directly.</p>
        </div>
      `,
    });
  }

  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Your Password Reset OTP',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #1a365d;">Password Reset Verification</h2>
          <p>You requested a password reset. Use the following One-Time Password (OTP) to proceed:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2b6cb0; text-align: center; margin: 30px 0; background: #ebf8ff; padding: 15px; border-radius: 6px;">
            ${otp}
          </div>
          <p>This code is valid for 15 minutes. If you did not make this request, you can ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #718096;">This is an automated system email. Please do not reply directly.</p>
        </div>
      `,
    });
  }

  async sendWorkflowUpdate(email: string, paperId: string, title: string, status: string, message: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Journal System Update: Paper ${paperId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #1a365d;">Manuscript Status Update</h2>
          <p>Paper ID: <strong>${paperId}</strong></p>
          <p>Title: <em>${title}</em></p>
          <div style="background: #f7fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3182ce;">
            <p style="margin: 0 0 10px 0;"><strong>Current Status:</strong> ${status}</p>
            <p style="margin: 0;">${message}</p>
          </div>
          <p>Please log in to your dashboard for details.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #718096;">This is an automated system email. Please do not reply directly.</p>
        </div>
      `,
    });
  }

  async sendReviewerRegistrationConfirmation(email: string, name: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Reviewer Application Received',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #1a365d;">Reviewer Application Confirmation</h2>
          <p>Dear Dr. ${name},</p>
          <p>Thank you for registering as a peer reviewer for our journal.</p>
          <p>Your application is currently <strong>pending approval</strong> by the Chief Editor. Once approved, your account will be activated, and you will receive a notification email to access your reviewer dashboard.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #718096;">This is an automated system email. Please do not reply directly.</p>
        </div>
      `,
    });
  }
}

export const mailService: MailService = new SMTPMailService();
