import axios from 'axios';
import { db } from '../firebase/firebaseAdmin';

/**
 * Modular WhatsApp Service
 * This now supports both Official Meta and QR-Code Gateways (Evolution API / Baileys Wrapper)
 */
export async function sendMessage(businessId: string, to: string, text: string) {
  try {
    const bizDoc = await db.collection('businesses').doc(businessId).get();
    const config = bizDoc.data();

    if (!config) throw new Error('Business not found');

    // --- GATEWAY MODE (QR CODE / EVOLUTION API) ---
    if (config.whatsapp_gateway_url) {
      const url = `${config.whatsapp_gateway_url}/message/sendText/${config.whatsapp_instance_id || businessId}`;
      await axios.post(url, {
        number: to,
        options: { delay: 1200, presence: "composing" },
        textMessage: { text: text }
      }, {
        headers: { 'apikey': config.whatsapp_gateway_key }
      });
      return { success: true, mode: 'gateway' };
    }

    // --- OFFICIAL META FALLBACK ---
    if (config?.whatsapp_phone_id && config?.whatsapp_token) {
      const url = `https://graph.facebook.com/v19.0/${config.whatsapp_phone_id}/messages`;
      await axios.post(url, {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text },
      }, {
        headers: { Authorization: `Bearer ${config.whatsapp_token}` }
      });
      return { success: true, mode: 'official' };
    }

    throw new Error('No WhatsApp messaging provider configured.');
  } catch (err: any) {
    console.error('[whatsappService] Error:', err.response?.data || err.message);
    throw err;
  }
}

export async function sendListMessage(businessId: string, to: string, text: string, buttonText: string, sections: any[]) {
  try {
    const bizDoc = await db.collection('businesses').doc(businessId).get();
    const config = bizDoc.data();
    if (!config) throw new Error('Business not found');

    // --- GATEWAY MODE (QR CODE) ---
    if (config.whatsapp_gateway_url) {
      const url = `${config.whatsapp_gateway_url}/message/sendList/${config.whatsapp_instance_id || businessId}`;
      await axios.post(url, {
        number: to,
        description: text,
        buttonText: buttonText,
        sections: sections,
      }, {
        headers: { 'apikey': config.whatsapp_gateway_key }
      });
      return { success: true };
    }

    // --- OFFICIAL META FALLBACK ---
    const url = `https://graph.facebook.com/v19.0/${config?.whatsapp_phone_id}/messages`;
    await axios.post(url, {
      messaging_product: 'whatsapp',
      to: to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: text },
        action: { button: buttonText, sections: sections }
      }
    }, {
      headers: { Authorization: `Bearer ${config?.whatsapp_token}` }
    });

    return { success: true };
  } catch (err: any) {
    console.error('[whatsappService] List message error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * Send interactive reply buttons (up to 3 buttons)
 * Each button: { id: string, title: string }
 */
export async function sendReplyButtons(businessId: string, to: string, text: string, buttons: { id: string; title: string }[], footer?: string) {
  try {
    const bizDoc = await db.collection('businesses').doc(businessId).get();
    const config = bizDoc.data();
    if (!config) throw new Error('Business not found');

    const buttonList = buttons.slice(0, 3).map(b => ({
      type: 'reply',
      reply: { id: b.id, title: b.title.substring(0, 20) }
    }));

    // --- GATEWAY MODE ---
    if (config.whatsapp_gateway_url) {
      const url = `${config.whatsapp_gateway_url}/message/sendButtons/${config.whatsapp_instance_id || businessId}`;
      await axios.post(url, {
        number: to,
        title: 'Quick Actions',
        description: text,
        footer: footer || '',
        buttons: buttons.slice(0, 3).map(b => ({
          buttonId: b.id,
          buttonText: { displayText: b.title.substring(0, 20) },
          type: 1
        }))
      }, {
        headers: { 'apikey': config.whatsapp_gateway_key }
      });
      return { success: true, mode: 'gateway' };
    }

    // --- OFFICIAL META ---
    if (config?.whatsapp_phone_id && config?.whatsapp_token) {
      const url = `https://graph.facebook.com/v19.0/${config.whatsapp_phone_id}/messages`;
      await axios.post(url, {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: text },
          ...(footer ? { footer: { text: footer } } : {}),
          action: { buttons: buttonList }
        }
      }, {
        headers: { Authorization: `Bearer ${config.whatsapp_token}` }
      });
      return { success: true, mode: 'official' };
    }

    throw new Error('No WhatsApp messaging provider configured.');
  } catch (err: any) {
    console.error('[whatsappService] Reply buttons error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * Send an image message with optional caption
 */
export async function sendImageMessage(businessId: string, to: string, imageUrl: string, caption?: string) {
  try {
    const bizDoc = await db.collection('businesses').doc(businessId).get();
    const config = bizDoc.data();
    if (!config) throw new Error('Business not found');

    // --- GATEWAY MODE ---
    if (config.whatsapp_gateway_url) {
      const url = `${config.whatsapp_gateway_url}/message/sendMedia/${config.whatsapp_instance_id || businessId}`;
      await axios.post(url, {
        number: to,
        options: { delay: 1200, presence: "composing" },
        mediaMessage: {
          mediatype: "image",
          media: imageUrl,
          caption: caption || '',
        }
      }, {
        headers: { 'apikey': config.whatsapp_gateway_key }
      });
      return { success: true, mode: 'gateway' };
    }

    // --- OFFICIAL META ---
    if (config?.whatsapp_phone_id && config?.whatsapp_token) {
      const url = `https://graph.facebook.com/v19.0/${config.whatsapp_phone_id}/messages`;
      await axios.post(url, {
        messaging_product: 'whatsapp',
        to: to,
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption || '',
        }
      }, {
        headers: { Authorization: `Bearer ${config.whatsapp_token}` }
      });
      return { success: true, mode: 'official' };
    }

    throw new Error('No WhatsApp messaging provider configured.');
  } catch (err: any) {
    console.error('[whatsappService] Image message error:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * Send CTA URL button message
 */
export async function sendCTAButton(businessId: string, to: string, text: string, buttonText: string, url: string) {
  try {
    const bizDoc = await db.collection('businesses').doc(businessId).get();
    const config = bizDoc.data();
    if (!config) throw new Error('Business not found');

    // --- GATEWAY MODE ---
    if (config.whatsapp_gateway_url) {
      // Gateway doesn't natively support CTA, send as text with link
      await sendMessage(businessId, to, `${text}\n\n🔗 ${buttonText}: ${url}`);
      return { success: true, mode: 'gateway-fallback' };
    }

    // --- OFFICIAL META ---
    if (config?.whatsapp_phone_id && config?.whatsapp_token) {
      const apiUrl = `https://graph.facebook.com/v19.0/${config.whatsapp_phone_id}/messages`;
      await axios.post(apiUrl, {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          body: { text: text },
          action: {
            name: 'cta_url',
            parameters: {
              display_text: buttonText,
              url: url
            }
          }
        }
      }, {
        headers: { Authorization: `Bearer ${config.whatsapp_token}` }
      });
      return { success: true, mode: 'official' };
    }

    throw new Error('No WhatsApp messaging provider configured.');
  } catch (err: any) {
    console.error('[whatsappService] CTA button error:', err.response?.data || err.message);
    // Fallback to plain text
    await sendMessage(businessId, to, `${text}\n\n🔗 ${buttonText}: ${url}`);
    return { success: true, mode: 'fallback' };
  }
}
