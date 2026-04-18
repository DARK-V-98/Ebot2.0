import * as aiService from './aiService';
import * as userService from './userService';
import * as messageService from './messageService';
import * as productService from './productService';
import * as orderService from './orderService';
import * as whatsappService from './whatsappService';
import * as mediaService from './mediaService';
import * as notificationService from './notificationService';
import { db } from '../firebase/firebaseAdmin';

export async function getSession(customerId: string) {
  const docRef = db.collection('sessions').doc(customerId);
  const doc = await docRef.get();
  
  if (doc.exists) {
    return { id: doc.id, ...doc.data() };
  }

  const now = new Date().toISOString();
  await docRef.set({
    customer_id: customerId,
    state: 'idle',
    context_json: '{}',
    last_active: now
  });

  const fresh = await docRef.get();
  return { id: fresh.id, ...fresh.data() };
}

export async function updateSession(customerId: string, state: string, context = {}) {
  await db.collection('sessions').doc(customerId).update({
    state,
    context_json: JSON.stringify(context),
    last_active: new Date().toISOString()
  });
}

/**
 * Process a media message from WhatsApp
 */
export async function processMediaMessage({ businessId, businessName, phone, contactName, media, whatsappMsgId, isSimulation = false }: any) {
  const customer: any = await userService.findOrCreateCustomer(businessId, phone, contactName);
  
  // Analyze image with Gemini Vision if it's an image
  if (media.type === 'image' && media.base64) {
    try {
      media.transcription = await mediaService.analyzeImageWithVision(media.base64, media.mimetype || 'image/jpeg');
      console.log(`[brain] 🖼️ Image analysis: ${media.transcription}`);
    } catch (err: any) {
      console.error('[brain] Vision analysis failed:', err.message);
      media.transcription = 'Image received but analysis unavailable';
    }
  }

  // Save the media message
  const saved = await mediaService.saveMediaMessage({
    businessId,
    customerId: customer.id,
    media,
    direction: 'in',
    whatsappMsgId,
  });

  // Create notification for media received
  await notificationService.createNotification({
    businessId,
    type: 'media_received',
    title: `${media.type.charAt(0).toUpperCase() + media.type.slice(1)} from ${contactName || phone}`,
    body: media.transcription || `Received ${media.type} message`,
    link: '/conversations',
    customerId: customer.id,
    customerName: contactName || phone,
    metadata: { mediaType: media.type },
  });

  // Generate AI reply based on media context
  const session: any = await getSession(customer.id);
  
  // If in handover mode, don't reply
  if (session.state === 'handover') {
    console.log(`[brain] Handover active for ${phone}. AI is silent for media.`);
    return null;
  }

  const history = await messageService.getHistory(customer.id, 10);

  // Build a text representation for the AI
  let mediaContext = '';
  switch (media.type) {
    case 'image':
      mediaContext = media.transcription 
        ? `Customer sent an image. AI Vision analysis: "${media.transcription}". ${media.caption ? `Caption: "${media.caption}"` : ''}`
        : `Customer sent an image. ${media.caption ? `Caption: "${media.caption}"` : 'No caption provided.'}`;
      break;
    case 'audio':
      mediaContext = 'Customer sent a voice message. Voice transcription is not yet available. Please acknowledge and ask them to type their request.';
      break;
    case 'video':
      mediaContext = `Customer sent a video. ${media.caption ? `Caption: "${media.caption}"` : 'Please acknowledge and ask how you can help.'}`;
      break;
    case 'document':
      mediaContext = `Customer sent a document: "${media.filename || 'unknown file'}". Please acknowledge receipt.`;
      break;
    case 'sticker':
      mediaContext = 'Customer sent a sticker (emoji reaction). Respond naturally to maintain conversation flow.';
      break;
    case 'location':
      mediaContext = `Customer shared their location: Lat ${media.latitude}, Lon ${media.longitude}. This could be their delivery address or they want directions.`;
      break;
  }

  const reply = await aiService.generateReply({
    userMessage: mediaContext,
    language: customer.language || 'english',
    intent: media.type === 'location' ? 'location' : 'unknown',
    businessName,
    products: [],
    sessionContext: { state: session.state },
    history,
  });

  // Save the bot reply
  await messageService.saveMessage({
    businessId,
    customerId: customer.id,
    message: reply,
    direction: 'out',
    intent: null,
    language: customer.language || 'english',
  });

  // Send reply via WhatsApp
  if (!isSimulation) {
    await whatsappService.sendMessage(businessId, phone, reply);
  }

  return { reply, products: [] };
}

export async function processMessage({ businessId, businessName, phone, contactName, messageText, whatsappMsgId, isSimulation = false }: any) {
  const customer: any = await userService.findOrCreateCustomer(businessId, phone, contactName);

  const textLower = messageText.toLowerCase().trim();
  const greetings = ['hi', 'hello', 'hey', 'start', 'halo', 'hi ebot'];
  const thanksList = ['thanks', 'thank you', 'ok', 'okay', 'done', 'tq'];

  let language = customer.language || 'english';
  let intent = 'unknown';
  let extracted_keywords: string[] = [];
  let translation = '';
  let skipAI = false;

  if (greetings.includes(textLower)) {
    intent = 'greeting';
    skipAI = true;
  } else if (thanksList.includes(textLower)) {
    intent = 'thanks';
    skipAI = true;
  }

  if (!skipAI) {
    const aiResult = await aiService.detectLanguageAndIntent(messageText);
    language = aiResult.language;
    intent = aiResult.intent;
    extracted_keywords = aiResult.extracted_keywords;
    translation = aiResult.translation;

    if (language !== 'unknown' && customer.language !== language) {
      await userService.updateCustomerLanguage(customer.id, language);
    }
  }

  await messageService.saveMessage({
    businessId,
    customerId: customer.id,
    message: messageText,
    direction: 'in',
    intent,
    language,
    translation,
    whatsappMsgId,
  });

  const session: any = await getSession(customer.id);

  // --- HANDOVER CHECK ---
  if (session.state === 'handover' && intent !== 'cancel') {
     console.log(`[brain] Handover active for ${phone}. AI is silent.`);
     
     // Notify business owner about new message during handover
     await notificationService.createNotification({
       businessId,
       type: 'handover_request',
       title: `Message from ${contactName || phone} (Handover)`,
       body: messageText.substring(0, 100),
       link: '/conversations',
       customerId: customer.id,
       customerName: contactName || phone,
     });

     return null; 
  }

  const context = session.context_json
    ? (typeof session.context_json === 'string' ? JSON.parse(session.context_json) : session.context_json)
    : {};
  const history = await messageService.getHistory(customer.id, 10);

  let newState = session.state;
  let products: any[] = [];
  // Tracks which interactive UI to send
  let interactiveType: 'none' | 'reply_buttons' | 'list' | 'cta' | 'image' = 'none';
  let replyButtons: { id: string; title: string }[] = [];
  let ctaUrl = '';
  let ctaButtonText = '';

  switch (intent) {
    case 'greeting':
      newState = 'browsing';
      context.last_intent = 'greeting';
      // Send quick action buttons on greeting
      interactiveType = 'reply_buttons';
      replyButtons = [
        { id: 'browse_products', title: '🛍️ Browse Products' },
        { id: 'check_orders', title: '📦 My Orders' },
        { id: 'get_location', title: '📍 Store Location' },
      ];
      break;

    case 'thanks':
      newState = session.state; // preserve state
      interactiveType = 'none';
      break;

    case 'search_product':
      newState = 'browsing';
      context.last_intent = 'search_product';
      products = await productService.searchProducts(businessId, extracted_keywords, 5);
      context.last_products = products.map((p: any) => p.id);
      
      if (products.length === 1 && products[0].image_url) {
        interactiveType = 'image';
        context.pending_product_id = products[0].id;
        // Optionally add follow-up buttons
        replyButtons = [
          { id: 'buy_now', title: '🛒 Buy Now' },
          { id: 'browse_more', title: '🛍️ Browse More' }
        ];
      } else if (products.length > 0) {
        interactiveType = 'list';
      }
      break;

    case 'place_order': {
      newState = 'ordering';
      context.last_intent = 'place_order';

      if (extracted_keywords.length) {
        products = await productService.searchProducts(businessId, extracted_keywords, 3);
      } else if (context.last_products?.length) {
        for (const pid of context.last_products.slice(0, 3)) {
          const p = await productService.getProduct(businessId, pid);
          if (p) products.push(p);
        }
      }

      if (products.length === 1 && context.address) {
        try {
          const order: any = await orderService.createOrder({
            businessId,
            customerId: customer.id,
            productId:  products[0].id,
            quantity:   context.quantity || 1,
            address:    context.address,
          });
          context.last_order_id = order.id;
          newState = 'idle';

          // Notify about new order
          await notificationService.createNotification({
            businessId,
            type: 'new_order',
            title: `New Order from ${contactName || phone}`,
            body: `${products[0].name} × ${context.quantity || 1} — Rs.${order.total_price}`,
            link: '/orders',
            customerId: customer.id,
            customerName: contactName || phone,
            metadata: { orderId: order.id },
          });

          // Send order confirmation buttons
          interactiveType = 'reply_buttons';
          replyButtons = [
            { id: 'browse_more', title: '🛍️ Browse More' },
            { id: 'check_order', title: '📦 Track Order' },
          ];
        } catch (err: any) {
          console.error('[brain] Order creation error:', err.message);
        }
      } else if (products.length === 1) {
        newState = 'awaiting_address';
        context.pending_product_id = products[0].id;
      }
      break;
    }

    case 'cancel':
      newState = 'idle';
      context.pending_product_id = null;
      context.cart = null;
      // Send follow-up buttons
      interactiveType = 'reply_buttons';
      replyButtons = [
        { id: 'browse_products', title: '🛍️ Browse Products' },
        { id: 'talk_to_human', title: '👤 Talk to Human' },
      ];
      break;

    case 'handover':
      newState = 'handover';
      context.last_intent = 'handover';
      
      // Critical notification for handover
      await notificationService.createNotification({
        businessId,
        type: 'handover_request',
        title: `🚨 ${contactName || phone} wants to talk to a human!`,
        body: `Customer requested human assistance. Last message: "${messageText.substring(0, 80)}"`,
        link: '/conversations',
        customerId: customer.id,
        customerName: contactName || phone,
      });
      break;

    case 'help':
      newState = session.state;
      interactiveType = 'reply_buttons';
      replyButtons = [
        { id: 'browse_products', title: '🛍️ Browse Products' },
        { id: 'check_orders', title: '📦 My Orders' },
        { id: 'talk_to_human', title: '👤 Talk to Human' },
      ];
      break;

    case 'location':
      newState = session.state;
      interactiveType = 'cta';
      ctaUrl = 'https://maps.app.goo.gl/cckESsCgnYfe5jf77';
      ctaButtonText = '📍 Open in Maps';
      break;

    default:
      if (session.state === 'awaiting_address' && messageText.length > 5) {
        context.address = messageText;
        if (context.pending_product_id) {
          try {
            const order: any = await orderService.createOrder({
              businessId,
              customerId: customer.id,
              productId:  context.pending_product_id,
              quantity:   context.quantity || 1,
              address:    context.address,
            });
            context.last_order_id = order.id;
            context.pending_product_id = null;
            newState = 'idle';

            // Notify about new order
            await notificationService.createNotification({
              businessId,
              type: 'new_order',
              title: `New Order from ${contactName || phone}`,
              body: `Order #${order.id} placed via WhatsApp`,
              link: '/orders',
              customerId: customer.id,
              customerName: contactName || phone,
              metadata: { orderId: order.id },
            });

            interactiveType = 'reply_buttons';
            replyButtons = [
              { id: 'browse_more', title: '🛍️ Browse More' },
              { id: 'check_order', title: '📦 Track Order' },
            ];
          } catch (err: any) {
            console.error('[brain] Order creation error (address):', err.message);
          }
        }
      }
      // Handle product selection from catalog list
      else if (messageText.startsWith('prod_')) {
        const productId = messageText.replace('prod_', '');
        const p = await productService.getProduct(businessId, productId);
        if (p) {
          products = [p];
          context.last_products = [p.id];
          context.pending_product_id = p.id;
          if (p.image_url) {
            interactiveType = 'image';
          }
          // Optionally add follow-up buttons
          replyButtons = [
            { id: 'buy_now', title: '🛒 Buy Now' },
            { id: 'browse_more', title: '🛍️ Browse More' }
          ];
        }
      }
      // Detect button response IDs
      else if (messageText === 'browse_products' || messageText === 'browse_more') {
        newState = 'browsing';
        products = await productService.searchProducts(businessId, [], 10);
        if (products.length > 0) interactiveType = 'list';
      }
      else if (messageText === 'check_orders' || messageText === 'check_order') {
        context.last_intent = 'check_order';
      }
      else if (messageText === 'get_location') {
        interactiveType = 'cta';
        ctaUrl = 'https://maps.app.goo.gl/cckESsCgnYfe5jf77';
        ctaButtonText = '📍 Open in Maps';
      }
      else if (messageText === 'buy_now') {
        if (context.pending_product_id) {
          newState = 'awaiting_address';
          context.last_intent = 'place_order';
        } else {
          // Send them to browse if they clicked buy but lost context
          newState = 'browsing';
          products = await productService.searchProducts(businessId, [], 10);
          if (products.length > 0) interactiveType = 'list';
        }
      }
      else if (messageText === 'talk_to_human') {
        newState = 'handover';
        context.last_intent = 'handover';
        await notificationService.createNotification({
          businessId,
          type: 'handover_request',
          title: `🚨 ${contactName || phone} wants to talk to a human!`,
          body: `Customer clicked "Talk to Human" button`,
          link: '/conversations',
          customerId: customer.id,
          customerName: contactName || phone,
        });
      }
      break;
  }

  await updateSession(customer.id, newState, context);

  let reply = '';
  
  if (skipAI) {
    if (intent === 'greeting') {
      reply = `Hello! Welcome to ${businessName}. How can I help you today?`;
    } else if (intent === 'thanks') {
      reply = `You're welcome! Let me know if you need anything else.`;
    }
  } else {
    reply = await aiService.generateReply({
      userMessage:     messageText,
      language:        language !== 'unknown' ? language : (customer.language || 'english'),
      intent,
      businessName,
      products,
      sessionContext:  { state: newState, ...context },
      history:         history.slice(-4), // Context Shrinking: passing only last 4 messages instead of 10
    });
  }

  await messageService.saveMessage({
    businessId,
    customerId: customer.id,
    message:    reply,
    direction:  'out',
    intent:     null,
    language:   language !== 'unknown' ? language : customer.language,
  });

  // --- SEND REPLY WITH INTERACTIVE ELEMENTS ---
  if (!isSimulation) {
    switch (interactiveType) {
      case 'reply_buttons':
        // Send text reply first, then buttons
        try {
          await whatsappService.sendReplyButtons(
            businessId, phone, reply,
            replyButtons,
            businessName
          );
        } catch (err) {
          // Fallback to plain text if buttons fail
          console.warn('[brain] Reply buttons failed, falling back to text');
          await whatsappService.sendMessage(businessId, phone, reply);
        }
        break;

      case 'list':
        if (products.length > 0) {
          const rows = products.slice(0, 10).map((p: any) => ({
            id: `prod_${p.id}`,
            title: p.name.substring(0, 24),
            description: `Rs.${p.price} | ${p.category || ''}`.substring(0, 72)
          }));

          await whatsappService.sendListMessage(
            businessId, 
            phone, 
            reply,
            'Select Items', 
            [{ title: 'Available Catalog', rows }]
          );
        } else {
          await whatsappService.sendMessage(businessId, phone, reply);
        }
        break;

      case 'cta':
        try {
          await whatsappService.sendCTAButton(
            businessId, phone, reply,
            ctaButtonText, ctaUrl
          );
        } catch (err) {
          await whatsappService.sendMessage(businessId, phone, reply);
        }
        break;

      case 'image':
        try {
          const product = products[0];
          // We can set the AI generated reply as the caption for the image message
          await whatsappService.sendImageMessage(
            businessId, phone, product.image_url, reply
          );
          
          // If we also prepared replyButtons (like Buy Now), send them right after the image
          if (replyButtons.length > 0) {
            await whatsappService.sendReplyButtons(
              businessId, phone, "Would you like to proceed?",
              replyButtons,
              businessName
            );
          }
        } catch (err) {
          await whatsappService.sendMessage(businessId, phone, reply);
        }
        break;

      default:
        await whatsappService.sendMessage(businessId, phone, reply);
        break;
    }
  }

  return { reply, products, interactiveType, replyButtons };
}
