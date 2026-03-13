const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'Staff Management <onboarding@resend.dev>';

const resend = resendApiKey ? new Resend(resendApiKey) : null;

async function sendEmail({ to, subject, html }) {
  if (!resend || !to || !subject || !html) return { skipped: true };

  try {
    const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
    if (!recipients.length) return { skipped: true };

    const result = await resend.emails.send({
      from: resendFromEmail,
      to: recipients,
      subject,
      html,
    });

    return { skipped: false, result };
  } catch (err) {
    console.error('Email send failed:', err.message);
    return { skipped: false, error: err };
  }
}

module.exports = { sendEmail, resendApiKey };
