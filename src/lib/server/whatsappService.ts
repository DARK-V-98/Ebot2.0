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
