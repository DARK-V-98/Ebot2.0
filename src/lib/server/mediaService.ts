import { db } from '../firebase/firebaseAdmin';
import { GoogleGenerativeAI } from '@google/generative-ai';

const cleanKey = (key: string) => (key || '').replace(/['"]+/g, '').trim();
const genAI = new GoogleGenerativeAI(cleanKey(process.env.GEMINI_API_KEY || ''));

export type MediaType = 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location';

export interface MediaInfo {
  type: MediaType;
  mimetype?: string;
  caption?: string;
  filename?: string;
  base64?: string;       // base64 data URL for images/stickers
  latitude?: number;     // for location messages
  longitude?: number;
  duration?: number;     // for audio/video in seconds
  fileSize?: number;
  transcription?: string; // AI description or audio transcription
}

/**
 * Analyze an image using Gemini Vision
 * Returns a text description of the image contents
 */
export async function analyzeImageWithVision(base64Data: string, mimetype: string): Promise<string> {
  const geminiModels = [
    'models/gemini-2.5-flash',
    'models/gemini-2.5-pro',
    'models/gemini-flash-latest',
  ];

  // Strip data URL prefix if present
  const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

  const prompt = `You are analyzing an image sent by a customer in a WhatsApp commerce chat. 
Describe what you see briefly in 1-2 sentences. Focus on:
- If it's a product photo: identify the product type, brand if visible, condition
- If it's a screenshot: what it contains (receipt, order, etc.)
- If it's a location/map: describe the area
- Otherwise: brief general description
Keep it concise and helpful for a sales assistant context.`;

  for (const modelName of geminiModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimetype || 'image/jpeg',
            data: rawBase64,
          }
        }
      ]);
      return result.response.text().trim();
    } catch (err: any) {
      console.warn(`[mediaService] Vision ${modelName} failed:`, err.message);
    }
  }

  return 'Image received (AI analysis unavailable)';
}

/**
 * Save media metadata to Firestore alongside the message
 */
export async function saveMediaMessage({
  businessId,
  customerId,
  media,
  direction = 'in',
  whatsappMsgId = null
}: {
  businessId: string;
  customerId: string;
  media: MediaInfo;
  direction?: string;
  whatsappMsgId?: string | null;
}) {
  const now = new Date().toISOString();
  
  // Build a human-readable representation for the message text
  let messageText = '';
  switch (media.type) {
    case 'image':
      messageText = media.caption || '[📷 Image]';
      break;
    case 'audio':
      messageText = `[🎤 Voice Message${media.duration ? ` (${Math.round(media.duration)}s)` : ''}]`;
      break;
    case 'video':
      messageText = media.caption || `[🎬 Video${media.duration ? ` (${Math.round(media.duration)}s)` : ''}]`;
      break;
    case 'document':
      messageText = `[📄 Document: ${media.filename || 'file'}]`;
      break;
    case 'sticker':
      messageText = '[🎭 Sticker]';
      break;
    case 'location':
      messageText = `[📍 Location: ${media.latitude}, ${media.longitude}]`;
      break;
  }

  // Add AI analysis if available
  if (media.transcription) {
    messageText += `\n💡 AI Analysis: ${media.transcription}`;
  }

  const docRef = await db.collection('messages').add({
    business_id: businessId,
    customer_id: customerId,
    message: messageText,
    direction,
    intent: null,
    language: 'unknown',
    whatsapp_msg_id: whatsappMsgId,
    created_at: now,
    // Media-specific fields
    media_type: media.type,
    media_mimetype: media.mimetype || null,
    media_caption: media.caption || null,
    media_filename: media.filename || null,
    media_base64: media.type === 'image' || media.type === 'sticker' 
      ? (media.base64 || null) 
      : null, // Only store base64 for images/stickers (small files)
    media_latitude: media.latitude || null,
    media_longitude: media.longitude || null,
    media_duration: media.duration || null,
    media_transcription: media.transcription || null,
  });

  return { id: docRef.id, message: messageText, media };
}
