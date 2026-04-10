import axios from 'axios';
import { db } from '../firebase/firebaseAdmin';

export async function sendMessage(businessId: string, to: string, text: string) {
  try {
    const bizDoc = await db.collection('businesses').doc(businessId).get();
    const config = bizDoc.data();

    if (!config?.whatsapp_phone_id || !config?.whatsapp_token) {
      throw new Error('WhatsApp credentials not configured for this business.');
    }

    const url = `https://graph.facebook.com/v19.0/${config.whatsapp_phone_id}/messages`;
    
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${config.whatsapp_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: true };
  } catch (err: any) {
    console.error('[whatsappService] Error sending message:', err.response?.data || err.message);
    throw err;
  }
}
export async function sendListMessage(businessId: string, to: string, text: string, buttonText: string, sections: any[]) {
  try {
    const bizDoc = await db.collection('businesses').doc(businessId).get();
    const config = bizDoc.data();

    if (!config?.whatsapp_phone_id || !config?.whatsapp_token) {
      throw new Error('WhatsApp credentials not configured for this business.');
    }

    const url = `https://graph.facebook.com/v19.0/${config.whatsapp_phone_id}/messages`;
    
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: text },
          action: {
            button: buttonText,
            sections: sections
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${config.whatsapp_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: true };
  } catch (err: any) {
    console.error('[whatsappService] Error sending list message:', err.response?.data || err.message);
    throw err;
  }
}
