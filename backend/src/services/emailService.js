import { sendEmail } from '../config/nodemailer.js';
import path from 'path';
import fs from 'fs';

/**
 * Sends a welcome email to the newly registered user.
 */
export const sendRegistrationSuccessEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Welcome to Visitor Pass System</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Thank you for registering on our platform! Your account has been created successfully.</p>
      <p>Role Assigned: <strong style="color: #3b82f6;">${user.role}</strong></p>
      ${!user.isVerified ? `<p>Please verify your account using the OTP sent to your email.</p>` : `<p>Your email is verified, and you can now log in and access your panel.</p>`}
      <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Best regards,<br>Security Operations Team</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Registration Successful - Visitor Pass System',
    html
  });
};

/**
 * Sends a 6-digit OTP verification code.
 */
export const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Verify Your Email</h2>
      <p>Hello,</p>
      <p>You requested a verification code to complete your registration or security action. Please use the following 6-digit One-Time Password (OTP):</p>
      <div style="font-size: 28px; font-weight: bold; color: #1e3a8a; text-align: center; padding: 15px; background-color: #f1f5f9; border-radius: 6px; margin: 20px 0; letter-spacing: 4px;">
        ${otp}
      </div>
      <p style="color: #ef4444; font-size: 13px;">This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
      <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Best regards,<br>Security Operations Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Verification OTP - Visitor Pass System',
    html
  });
};

/**
 * Sends a confirmation email after successful OTP verification.
 */
export const sendOTPVerifiedEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Email Verified Successfully</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Your email has been successfully verified! Your account is now fully active.</p>
      <p>You can proceed to login and make appointments or access your dashboard features.</p>
      <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Best regards,<br>Security Operations Team</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Account Activated - Visitor Pass System',
    html
  });
};

/**
 * Sends approval notification with the PDF Pass attached.
 */
export const sendAppointmentApprovedEmail = async (visitor, host, appointment, relativePdfPath, passNumber) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Visit Appointment Approved!</h2>
      <p>Hello <strong>${visitor.fullName}</strong>,</p>
      <p>Your visit appointment request has been approved by your host, <strong>${host.name}</strong>.</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #0f172a;">Appointment details:</h4>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="width: 40%; font-weight: bold; color: #64748b;">Pass Number:</td>
            <td style="color: #0f172a;">${passNumber}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #64748b;">Host:</td>
            <td style="color: #0f172a;">${host.name} (${host.department || 'N/A'})</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #64748b;">Visit Date:</td>
            <td style="color: #0f172a;">${new Date(appointment.visitDate).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #64748b;">Visit Time:</td>
            <td style="color: #0f172a;">${appointment.visitTime}</td>
          </tr>
        </table>
      </div>

      <p><strong>Your digital visitor pass has been generated.</strong> Please find it attached to this email. You can present this PDF or the QR code at the Security/Front Desk upon arrival.</p>
      <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Best regards,<br>Security Operations Team</p>
    </div>
  `;

  // Resolve absolute path to attach
  const absolutePdfPath = path.resolve(relativePdfPath);
  const attachments = [];
  if (fs.existsSync(absolutePdfPath)) {
    attachments.push({
      filename: `Visitor_Pass_${passNumber}.pdf`,
      path: absolutePdfPath
    });
  }

  return sendEmail({
    to: visitor.email,
    subject: `Appointment Approved - Pass ${passNumber}`,
    html,
    attachments
  });
};

/**
 * Sends rejection notification.
 */
export const sendAppointmentRejectedEmail = async (visitor, host, appointment) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">Visit Appointment Declined</h2>
      <p>Hello <strong>${visitor.fullName}</strong>,</p>
      <p>We regret to inform you that your visit appointment request with <strong>${host.name}</strong> scheduled for <strong>${new Date(appointment.visitDate).toLocaleDateString()}</strong> at <strong>${appointment.visitTime}</strong> has been declined.</p>
      <p>If you believe this is in error, please contact the host directly or resubmit a request with corrected details.</p>
      <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Best regards,<br>Security Operations Team</p>
    </div>
  `;

  return sendEmail({
    to: visitor.email,
    subject: 'Appointment Declined - Visitor Pass System',
    html
  });
};

/**
 * Sends direct pass generation notification with the PDF attachment.
 */
export const sendPassGeneratedEmail = async (visitor, host, pass, relativePdfPath) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Your Digital Visitor Pass is Ready</h2>
      <p>Hello <strong>${visitor.fullName}</strong>,</p>
      <p>A new visitor pass has been generated for your upcoming visit to our office.</p>
      <p>Pass Number: <strong>${pass.passNumber}</strong></p>
      <p>Host: <strong>${host.name}</strong></p>
      <p>Please find your digital pass badge PDF attached. Ensure you keep it on your mobile device or print it out to present at check-in.</p>
      <p style="margin-top: 20px; font-size: 12px; color: #64748b;">Best regards,<br>Security Operations Team</p>
    </div>
  `;

  const absolutePdfPath = path.resolve(relativePdfPath);
  const attachments = [];
  if (fs.existsSync(absolutePdfPath)) {
    attachments.push({
      filename: `Visitor_Pass_${pass.passNumber}.pdf`,
      path: absolutePdfPath
    });
  }

  return sendEmail({
    to: visitor.email,
    subject: `Visitor Pass Issued - ${pass.passNumber}`,
    html,
    attachments
  });
};
