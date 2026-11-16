import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: process.env.PORT || 3001,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // Email Configuration (Phase 1)
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    fromName: process.env.EMAIL_FROM_NAME || 'BestQuoteFinder RFQ',
    isConfigured: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
  },

  // Google Places API (Optional)
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',

  // Phase 2 Integrations
  facebook: {
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
    pageId: process.env.FACEBOOK_PAGE_ID || '',
  },
  thumbtack: {
    accessToken: process.env.THUMBTACK_ACCESS_TOKEN || '',
  },
  messaging: {
    googleMessagesUrl: process.env.GOOGLE_MESSAGES_BRIDGE_URL || '',
    whatsappToken: process.env.WHATSAPP_API_TOKEN || '',
  },
  voice: {
    vapiApiKey: process.env.VAPI_API_KEY || '',
    twilioSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioPhone: process.env.TWILIO_PHONE_NUMBER || '',
  }
};
