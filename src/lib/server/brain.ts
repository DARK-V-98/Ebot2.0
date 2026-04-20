import * as aiService from './aiService';
import * as userService from './userService';
import * as messageService from './messageService';
import * as productService from './productService';
import * as orderService from './orderService';
import * as whatsappService from './whatsappService';
import * as mediaService from './mediaService';
import * as notificationService from './notificationService';
import { db } from '../firebase/firebaseAdmin';

const DEFAULT_BUSINESS_NAME = "Aarya Bathware";
const DEFAULT_MAP_URL = "https://maps.app.goo.gl/cckESsCgnYfe5jf77";
const DEFAULT_WEBSITE_URL = "https://aaryabathware.com";

export async function getSession(userId: string) {
  const docRef = db.collection('sessions').doc(userId);
  const doc = await docRef.get();
  
  if (doc.exists) {
    return { id: doc.id, ...doc.data() };
  }

  const now = new Date();
  await docRef.set({
    userId: userId,
    state: 'idle',
    context_json: '{}',
    last_active: now
  });

  const fresh = await docRef.get();
  return { id: fresh.id, ...fresh.data() };
}

export async function updateSession(userId: string, state: string, context = {}) {
  await db.collection('sessions').doc(userId).update({
    state,
    context_json: JSON.stringify(context),
    last_active: new Date()
  });
}

export async function processMediaMessage({ businessId, phone, contactName, media, whatsappMsgId, isSimulation = false }: any) {
  const businessName = DEFAULT_BUSINESS_NAME;
  const user: any = await userService.findOrCreateUserByPhone(phone, contactName);
  
  if (media.type === 'image' && media.base64) {
    try {
      media.transcription = await mediaService.analyzeImageWithVision(media.base64, media.mimetype || 'image/jpeg');
    } catch (err: any) {
      media.transcription = 'Image received but analysis unavailable';
    }
  }

  await mediaService.saveMediaMessage({
    businessId,
    customerId: user.id,
    media,
    direction: 'in',
    whatsappMsgId,
  });

  const history = await messageService.getHistory(user.id, 10);
  let mediaContext = `User sent a ${media.type}. `;
  if (media.type === 'image') mediaContext += `Analysis: "${media.transcription}"`;

  // Search for products based on image description
  if (media.type === 'image' && media.transcription) {
    const keywords = (media.transcription || '').split(' ').filter(w => w.length > 3);
    products = await productService.searchProducts(businessId, keywords, 3);
  }

  const reply = await aiService.generateReply({
    userMessage: mediaContext,
    language: user.language || 'english',
    intent: 'search_product',
    businessName,
    products,
    sessionContext: { state: session.state },
    history,
  });

  await messageService.saveMessage({
    businessId,
    customerId: user.id,
    message: reply,
    direction: 'out',
    intent: null,
    language: user.language || 'english',
  });

  if (!isSimulation) {
    await whatsappService.sendMessage(businessId, phone, reply);
  }

  return { reply, products: [] };
}

export async function processMessage({ businessId, phone, contactName, messageText, whatsappMsgId, isSimulation = false }: any) {
  const businessName = DEFAULT_BUSINESS_NAME;
  const user: any = await userService.findOrCreateUserByPhone(phone, contactName);
  const session: any = await getSession(user.id);
  const context = session.context_json ? JSON.parse(session.context_json) : {};

  let textLower = messageText.toLowerCase().trim();
  let language = user.language || 'english';
  let intent = 'unknown';
  let skipAI = false;

  // --- STATE-BASED NUMERIC INTERCEPTS ---
  const isNumber = /^\d+$/.test(textLower);
  const selectionInt = isNumber ? parseInt(textLower) : -1;

  if (['hi', 'hello', 'hey', 'start', '0'].includes(textLower)) {
    intent = 'greeting';
    skipAI = true;
    await updateSession(user.id, 'idle', {});
  } else if (textLower === 'back') {
    if (session.state === 'browsing_category') {
      intent = 'browse_menu';
      await updateSession(user.id, 'choosing_category', {});
    } else if (session.state === 'viewing_product') {
      // Go back to category list if we were in one, else back to menu
      intent = context.last_category ? 'view_category' : 'browse_menu';
      if (context.last_category) {
        textLower = context.last_category; // simulate selecting the category again
      }
    } else {
      intent = 'greeting';
    }
    skipAI = true;
  } else if (session.state === 'choosing_category' && isNumber) {
    const selectedCat = context.listed_categories?.[selectionInt - 1];
    if (selectedCat) {
      intent = 'view_category';
      context.current_category = selectedCat;
      skipAI = true;
    }
  } else if (session.state === 'browsing_category' && isNumber) {
    const selectedProdId = context.listed_product_ids?.[selectionInt - 1];
    if (selectedProdId) {
      intent = 'view_product';
      context.current_product_id = selectedProdId;
      skipAI = true;
    }
  } else if (textLower === '1' || ['menu', 'categories', 'browse'].includes(textLower)) {
    intent = 'browse_menu';
    skipAI = true;
  } else if (textLower === '2' || ['search', 'find', 'products'].includes(textLower)) {
    intent = 'search_product';
    skipAI = true;
  } else if (textLower === '3' || ['location', 'address', 'where', 'map'].includes(textLower)) {
    intent = 'location';
    skipAI = true;
  } else if (textLower === '4' || ['human', 'help', 'support', 'owner'].includes(textLower)) {
    intent = 'handover';
    skipAI = true;
  } else if (['times', 'opening', 'hours', 'open'].some(k => textLower.includes(k))) {
    intent = 'opening_times';
    skipAI = true;
  }

  if (!skipAI) {
    const aiResult = await aiService.detectLanguageAndIntent(messageText);
    language = aiResult.language;
    intent = aiResult.intent;
  }

  let products: any[] = [];
  let interactiveType: 'none' | 'reply_buttons' | 'list' | 'cta' | 'image' = 'none';
  let replyButtons: { id: string; title: string }[] = [];
  let ctaUrl = '';
  let ctaButtonText = '';
  let reply = '';
  let welcomeReply = '';

  const OPENING_TIMES = `🏪 Opening Hours:
• Monday - Friday: 9:00 AM – 4:30 PM
• Saturday: Open 24 hours 🕒
• Sunday: 9:00 AM – 4:30 PM`;

  switch (intent) {
    case 'greeting':
      reply = `👋 Welcome to ${businessName}! 🚿✨\n\nHow can I help you today? Please choose an option:\n\n1️⃣ Browse Categories 🛍️\n2️⃣ Search Product 🔍\n3️⃣ Location & Times 📍\n4️⃣ Human Support 👨‍💼\n\nYou can reply with the number or just tell me!`;
      interactiveType = 'reply_buttons';
      replyButtons = [
        { id: 'browse_menu', title: '🛍️ Categories' },
        { id: 'search', title: '🔍 Search Product' },
        { id: 'opening_times', title: '📍 Location & Times' },
      ];
      break;

    case 'browse_menu':
      const cats = await productService.getCategories(businessId);
      context.listed_categories = cats;
      reply = `🛍️ *Our Categories*\n\nPlease select a category number (e.g., reply with 1):\n\n` + 
              cats.map((c: string, i: number) => `${i + 1}️⃣ ${c}`).join('\n') + 
              `\n\n0️⃣ Back to Main Menu`;
      await updateSession(user.id, 'choosing_category', context);
      break;

    case 'view_category':
      const catName = context.current_category;
      context.last_category = catName;
      const catProducts = await productService.listProducts(businessId, { category: catName, limit: 20 });
      context.listed_product_ids = catProducts.products.map((p: any) => p.id);
      
      reply = `📂 *Products in ${catName}*\n\n` + 
              catProducts.products.map((p: any, i: number) => `${i + 1}️⃣ ${p.name} - Rs. ${p.price}`).join('\n') + 
              `\n\n🔙 Reply *Back* to Categories\n0️⃣ Home`;
      
      await updateSession(user.id, 'browsing_category', context);
      break;

    case 'view_product':
      const prod = await productService.getProduct(businessId, context.current_product_id);
      if (prod) {
        const stockStatus = prod.stock > 0 ? '✅ In Stock' : '❌ Out of Stock';
        reply = `✨ *${prod.name}*\n\n` +
                `💰 Price: Rs. ${prod.price}\n` +
                `📂 Category: ${prod.category}\n` +
                `📦 Status: ${stockStatus}\n\n` +
                `📝 Details: ${prod.description || 'Premium quality bathware component.'}\n\n` +
                `🔙 Reply *Back* to list\n0️⃣ Home`;
        
        products = [prod];
        interactiveType = 'image';
        await updateSession(user.id, 'viewing_product', context);
      } else {
        reply = "Sorry, I couldn't find that product details.";
      }
      break;

    case 'opening_times':
      reply = `${OPENING_TIMES}\n\n📍 Visit us at: ${DEFAULT_MAP_URL}`;
      interactiveType = 'cta';
      ctaUrl = DEFAULT_MAP_URL;
      ctaButtonText = '📍 Google Maps';
      break;

    case 'search_product':
      const aiDetect = await aiService.detectLanguageAndIntent(messageText);
      products = await productService.searchProducts(businessId, aiDetect.extracted_keywords, 5);
      if (products.length === 0) {
        reply = "I couldn't find exactly that. You can browse our categories or send me a photo!";
      } else if (products.length === 1 && products[0].image_url) {
        const p = products[0];
        reply = `🔍 I found this: *${p.name}*\nPrice: Rs. ${p.price}\n\nWould you like more details?`;
        interactiveType = 'image';
      } else {
        reply = `🔍 I found these items for you:\n\n` + 
                products.map((p: any, i: number) => `• ${p.name} - Rs. ${p.price}`).join('\n') +
                `\n\nTry searching for something more specific!`;
      }
      break;

    case 'handover':
      reply = `I'll connect you with our support team. Please wait... 👨‍💼`;
      await updateSession(user.id, 'handover', context);
      break;
  }

  if (!reply) {
    const history = await messageService.getHistory(user.id, 5);
    const categories = await productService.getCategories(businessId);
    reply = await aiService.generateReply({
      userMessage: messageText,
      language: language,
      intent,
      businessName,
      products,
      categories,
      sessionContext: { state: session.state, ...context },
      history,
    });
  }

  await messageService.saveMessage({
    businessId,
    customerId: user.id,
    message: reply,
    direction: 'out',
    intent: null,
    language,
  });

  if (!isSimulation) {
    await whatsappService.sendMessage(businessId, phone, reply);
    // Note: Send interactive elements here if implemented
  }

  return { reply, products, interactiveType, replyButtons, welcomeReply };
}
