import nodemailer from "nodemailer";

// Create transporter
// Automatically use Resend SMTP if an API key is provided, 
// otherwise check for generic SMTP, and fallback to Ethereal Email for Dev.
const createTransporter = async () => {
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
      },
    });
  }

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback to Ethereal for dev
  const testAccount = await nodemailer.createTestAccount();
  console.log("📨 Using Ethereal Email for development");
  console.log(`   User: ${testAccount.user}`);
  console.log(`   Pass: ${testAccount.pass}`);

  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

let transporter: nodemailer.Transporter | null = null;

const getTransporter = async () => {
  if (!transporter) {
    transporter = await createTransporter();
  }
  return transporter;
};

export const emailService = {
  /**
   * Send workspace invitation email
   */
  sendWorkspaceInvite: async (
    to: string,
    workspaceName: string,
    inviterName: string,
    inviteToken: string,
  ) => {
    try {
      const transport = await getTransporter();
      const inviteLink = `http://localhost:3000/accept-invite?token=${inviteToken}`;

      const info = await transport.sendMail({
        from: '"TrackCodex" <onboarding@resend.dev>', // Resend domains must be verified, fallback to onboarding@resend.dev for testing
        to,
        subject: `You've been invited to join ${workspaceName} on TrackCodex`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 6px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #24292e;">TrackCodex Workspace Invitation</h2>
            </div>
            <p>Hello,</p>
            <p><strong>${inviterName}</strong> has invited you to join the workspace <strong>${workspaceName}</strong> on TrackCodex.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #2ea44f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
            </div>
            <p style="color: #586069; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="background-color: #f6f8fa; padding: 10px; border-radius: 6px; font-size: 12px; word-break: break-all;">${inviteLink}</p>
            <p style="color: #586069; font-size: 12px; margin-top: 30px; text-align: center;">This link will expire in 7 days.</p>
          </div>
        `,
      });

      console.log(`📧 Invite email sent to ${to}`);
      if (!process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
        console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to send invite email:", error);
      return false;
    }
  },

  /**
   * Send a general application notification email (Job Offers, Updates, etc.)
   */
  sendAppNotification: async (
    to: string,
    title: string,
    message: string,
    link?: string
  ) => {
    try {
      const transport = await getTransporter();
      const actionHtml = link
        ? `<div style="text-align: center; margin: 30px 0;">
             <a href="${link}" style="background-color: #0969da; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Details</a>
           </div>`
        : "";

      const info = await transport.sendMail({
        from: '"TrackCodex" <onboarding@resend.dev>', // Resend testing domain
        to,
        subject: title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 6px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #24292e;">${title}</h2>
            </div>
            <p style="color: #24292e; font-size: 16px; line-height: 1.5;">${message}</p>
            ${actionHtml}
            <hr style="border: 0; border-top: 1px solid #e1e4e8; margin-top: 30px; margin-bottom: 20px;" />
            <p style="color: #586069; font-size: 12px; text-align: center;">This is an automated notification from TrackCodex.</p>
          </div>
        `,
      });

      console.log(`📧 Notification email sent to ${to}`);
      if (!process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
        console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to send notification email:", error);
      return false;
    }
  },

  /**
   * Send OTP verification email
   */
  sendOTP: async (to: string, otp: string) => {
    try {
      const transport = await getTransporter();
      const info = await transport.sendMail({
        from: '"TrackCodex" <onboarding@resend.dev>',
        to,
        subject: `${otp} is your TrackCodex verification code`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; border: 1px solid #e1e4e8; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #24292e; font-size: 24px; font-weight: 700; margin-bottom: 8px;">Verification Code</h1>
              <p style="color: #586069; font-size: 16px;">Enter the following code to verify your identity.</p>
            </div>
            
            <div style="background-color: #f6f8fa; padding: 24px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <span style="font-family: monospace; font-size: 36px; font-weight: 700; color: #0969da; letter-spacing: 8px;">${otp}</span>
            </div>
            
            <p style="color: #586069; font-size: 14px; line-height: 1.5; text-align: center;">
              This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.
            </p>
            
            <hr style="border: 0; border-top: 1px solid #e1e4e8; margin: 30px 0;" />
            
            <p style="color: #8c959f; font-size: 12px; text-align: center;">
              &copy; 2026 TrackCodex Inc. <br />
              All rights reserved.
            </p>
          </div>
        `,
      });

      console.log(`📧 OTP email sent to ${to}`);
      if (!process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
        console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      return true;
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      return false;
    }
  },

  /**
   * Send email verification link
   */
  sendVerificationEmail: async (to: string, link: string) => {
    try {
      const transport = await getTransporter();
      await transport.sendMail({
        from: '"TrackCodex" <onboarding@resend.dev>',
        to,
        subject: "Verify your TrackCodex email",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 6px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #24292e;">Verify your email address</h2>
            </div>
            <p>Please click the button below to verify your email address and complete your TrackCodex registration.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background-color: #0969da; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
            </div>
            <p style="color: #586069; font-size: 14px;">This link will expire in 24 hours.</p>
            <hr style="border: 0; border-top: 1px solid #e1e4e8; margin-top: 30px; margin-bottom: 20px;" />
            <p style="color: #586069; font-size: 12px; text-align: center;">If you didn't create an account, you can ignore this email.</p>
          </div>
        `,
      });
      console.log(`📧 Verification email sent to ${to}`);
      return true;
    } catch (error) {
      console.error("Failed to send verification email:", error);
      return false;
    }
  },

  /**
   * Send password reset link
   */
  sendPasswordResetEmail: async (to: string, link: string, username?: string) => {
    try {
      const transport = await getTransporter();
      await transport.sendMail({
        from: '"TrackCodex" <onboarding@resend.dev>',
        to,
        subject: "Reset your TrackCodex password",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; border: 1px solid #e1e4e8; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #24292e; font-size: 24px; font-weight: 600;">Change password for @${username || to.split('@')[0]}</h2>
            </div>
            <p style="color: #24292e; font-size: 16px; line-height: 1.5;">We received a request to reset the password for your TrackCodex account. Click the button below to choose a new one.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background-color: #24292f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #586069; font-size: 14px; text-align: center;">This link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e1e4e8; margin: 30px 0;" />
            <p style="color: #8c959f; font-size: 12px; text-align: center;">
                &copy; 2026 TrackCodex Inc. <br />
                Sent to you because you requested a password reset.
            </p>
          </div>
        `,
      });
      console.log(`📧 Password reset email sent to ${to}`);
      return true;
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      return false;
    }
  },
};
