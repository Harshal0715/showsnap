import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({
  to,
  subject,
  html,
  text,
  from,
  attachments,
  replyTo,
  cc,
  bcc,
  retries = 2
}) => {
  if (!to || !subject || !html) {
    throw new Error('Missing required email fields');
  }

  const sender = from || `"ShowSnap 🎬" <${process.env.EMAIL_USER}>`;
  const plainText = text || html.replace(/<[^>]+>/g, '').slice(0, 1000);

  const mailOptions = {
    from: sender,
    to,
    subject,
    html,
    text: plainText,
    attachments: Array.isArray(attachments) ? attachments : [],
    replyTo,
    cc,
    bcc
  };

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📬 Email sent to ${to} — Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} — Failed to send email:`, error.message);
      if (attempt > retries) throw new Error(`Email failed after ${retries + 1} attempts`);
      await new Promise(res => setTimeout(res, 1000 * attempt));
    }
  }
};

export default sendEmail;
