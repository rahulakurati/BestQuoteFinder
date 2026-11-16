import nodemailer from 'nodemailer';
import { config } from '../config.js';

// Setup Nodemailer transporter if credentials exist
let transporter = null;
if (config.email.isConfigured) {
  try {
    transporter = nodemailer.createTransport({
      service: config.email.service,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });
  } catch (err) {
    console.error('Failed to initialize nodemailer transporter:', err.message);
  }
}

/**
 * Generate a standardized, high-converting RFQ email template
 */
export function generateRFQEmail(job, provider) {
  const rfqTrackingId = `RFQ-${job.id.slice(0, 8).toUpperCase()}`;
  const subject = `[${rfqTrackingId}] Quote Request: ${job.serviceType} in ${job.zipCode} (${job.urgency || 'Standard'})`;

  const promoMention = provider.promotions && provider.promotions.length > 0
    ? `\nNote: I saw your online special (${provider.promotions[0].title}) and would like to confirm if this applies.\n`
    : '';

  const body = `Hi ${provider.name} Team,

I am requesting a service quote for a ${job.serviceType} at a residential property in ZIP code ${job.zipCode}.

--- JOB DETAILS ---
• Issue / Symptoms: ${job.symptoms || job.description || 'Water heater stopped working'}
• Unit Details: ${job.unitDetails || 'Standard residential unit'}
• Urgency: ${job.urgency || 'Within 24-48 hours'}
• Preferred Timeline: ${job.preferredTime || 'As soon as possible'}
${promoMention}
--- PLEASE PROVIDE THE FOLLOWING DETAILS ---
1. What is your diagnostic / service call fee to inspect the unit?
2. Is the diagnostic fee waived or applied as a credit towards the final repair if we proceed with your service?
3. What is your earliest available arrival window?
4. What is your standard warranty on parts and labor for this repair?
5. Do you provide a written itemized estimate before starting any work?

Please reply directly to this email with your quote and availability, keeping the subject line reference [${rfqTrackingId}] so we can confirm quickly.

Thank you,
${job.contactName || 'Homeowner'}
${job.contactPhone ? `Phone: ${job.contactPhone}` : ''}
`;

  // Pre-generate a 1-click mailto: URI for instant desktop/web client opening
  const mailtoUri = `mailto:${encodeURIComponent(provider.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    rfqTrackingId,
    subject,
    body,
    mailtoUri
  };
}

/**
 * Dispatch RFQ Email to a provider
 */
export async function sendRFQEmail(job, provider) {
  const { rfqTrackingId, subject, body, mailtoUri } = generateRFQEmail(job, provider);

  if (!config.email.isConfigured || !transporter) {
    // If SMTP credentials aren't set in .env yet, return the rendered template with mailto link
    return {
      success: true,
      mode: 'mailto_draft',
      message: 'SMTP credentials not yet configured in .env. Generated 1-click mailto link.',
      rfqTrackingId,
      subject,
      body,
      mailtoUri
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.user}>`,
      to: provider.email,
      subject: subject,
      text: body
    });

    return {
      success: true,
      mode: 'smtp_sent',
      messageId: info.messageId,
      rfqTrackingId,
      subject,
      body
    };
  } catch (error) {
    console.error(`Error sending email to ${provider.email}:`, error);
    return {
      success: false,
      mode: 'error',
      error: error.message,
      rfqTrackingId,
      subject,
      body,
      mailtoUri
    };
  }
}
