import nodemailer from 'nodemailer';

let transporter;

export const initMailTransporter = async () => {
  const host = process.env.EMAIL_HOST || 'smtp.ethereal.email';
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
    console.log('Nodemailer SMTP Transporter configured.');
  } else {
    // Generate test SMTP service account from ethereal.email if no credentials provided
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('--- Nodemailer Ethereal Test Account Generated ---');
      console.log(`User: ${testAccount.user}`);
      console.log(`Pass: ${testAccount.pass}`);
      console.log('--------------------------------------------------');
    } catch (err) {
      console.error('Failed to create Ethereal Mail test account, using console logger fallback.', err.message);
      // Fallback dummy transporter
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('=== EMAIL LOGGER FALLBACK ===');
          console.log(`To: ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log(`Text: ${mailOptions.text}`);
          console.log('=============================');
          return { messageId: 'console-log-fallback-id' };
        }
      };
    }
  }
};

export const sendEmail = async ({ to, subject, html, attachments }) => {
  if (!transporter) {
    await initMailTransporter();
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Visitor Pass System" <no-reply@visitorpass.com>',
    to,
    subject,
    html,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    // If it's ethereal email, print URL to view it
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (error) {
    console.error(`Email send failed: ${error.message}`);
    throw error;
  }
};
