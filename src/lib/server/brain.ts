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

  const session: any = await getSession(user.id);
  if (session.state === 'handover') return null;

  const history = await messageService.getHistory(user.id, 10);
  let mediaContext = `User sent a ${media.type}. `;
  if (media.type === 'image') mediaContext += `Analysis: "${media.transcription}"`;

  const reply = await aiService.generateReply({
    userMessage: mediaContext,
    language: user.language || 'english',
    intent: 'unknown',
    businessName,
    products: [],
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

  const textLower = messageText.toLowerCase().trim();
  let language = user.language || 'english';
  let intent = 'unknown';
  let skipAI = false;

  // Manual Intercepts & Numeric Menu
  if (['hi', 'hello', 'hey', 'start'].includes(textLower)) {
    intent = 'greeting';
    skipAI = true;
  } else if (textLower === '1' || ['menu', 'categories', 'browse'].includes(textLower)) {
    intent = 'browse_menu';
    skipAI = true;
  } else if (textLower === '2' || ['search', 'find', 'products'].includes(textLower)) {
    intent = 'search_product';
    skipAI = true;
  } else if (textLower === '3' || ['location', 'address', 'where', 'map'].includes(textLower)) {
    intent = 'location'; // Usually redirects to same as opening_times
    skipAI = true;
  } else if (textLower === '4' || ['human', 'help', 'support', 'owner'].includes(textLower)) {
    intent = 'handover';
    skipAI = true;
  } else if (textLower === 'view_website') {
    intent = 'view_website';
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

  await messageService.saveMessage({
    businessId,
    customerId: user.id,
    message: messageText,
    direction: 'in',
    intent,
    language,
    whatsappMsgId,
  });

  if (session.state === 'handover' && intent !== 'cancel') {
    return null; 
  }

  const history = await messageService.getHistory(user.id, 10);
  const isFirstContact = history.length === 0;

  let products: any[] = [];
  let interactiveType: 'none' | 'reply_buttons' | 'list' | 'cta' | 'image' = 'none';
  let replyButtons: { id: string; title: string }[] = [];
  let ctaUrl = '';
  let ctaButtonText = '';
  let reply = '';
  let welcomeReply = '';

  if (isFirstContact && intent !== 'greeting') {
    welcomeReply = `👋 Hello! Welcome to ${businessName}. I'm Aarya, your AI assistant. ✨\n\nGive me a moment while I look that up for you... 🕵️‍♀️`;
  }

  const OPENING_TIMES = `🏪 Opening Hours:
• Monday - Friday: 9:00 AM – 4:30 PM
• Saturday: Open 24 hours 🕒
• Sunday: 9:00 AM – 4:30 PM`;

  switch (intent) {
    case 'greeting':
      reply = `👋 Welcome to ${businessName}! 🚿✨\n\nHow can I help you today? Please choose an option:\n\n1️⃣ Browse Categories 🛍️\n2️⃣ Search Product 🔍\n3️⃣ Location & Times 📍\n4️⃣ Human Support 👨‍💼\n\nYou can reply with the number or just tell me what you need!`;
      interactiveType = 'reply_buttons';
      replyButtons = [
        { id: 'browse_menu', title: '🛍️ Categories' },
        { id: 'search', title: '🔍 Search Product' },
        { id: 'opening_times', title: '📍 Location & Times' },
      ];
      break;

    case 'opening_times':
      reply = `${OPENING_TIMES}\n\n📍 Visit us at: ${DEFAULT_MAP_URL}`;
      interactiveType = 'cta';
      ctaUrl = DEFAULT_MAP_URL;
      ctaButtonText = '📍 Google Maps';
      break;

    case 'search_product':
      const keywords = (await aiService.detectLanguageAndIntent(messageText)).extracted_keywords;
      products = await productService.searchProducts(businessId, keywords, 5);
      if (products.length === 1 && products[0].image_url) {
        interactiveType = 'image';
        replyButtons = [
             { id: 'view_website', title: '🌐 View on Website' },
             { id: 'browse_menu', title: '🛍️ Browse More' }
        ];
      }
      break;

    case 'location':
      reply = `📍 Visit us at Aarya Bathware in Kottawa!\n\n${OPENING_TIMES}\n\nGoogle Maps: ${DEFAULT_MAP_URL}`;
      interactiveType = 'cta';
      ctaUrl = DEFAULT_MAP_URL;
      ctaButtonText = '📍 Google Maps';
      break;

    case 'view_website':
      reply = `You can explore our full collection and prices on our official website:`;
      interactiveType = 'cta';
      ctaUrl = DEFAULT_WEBSITE_URL;
      ctaButtonText = '🌐 Visit Website';
      break;

    case 'handover':
      reply = `I'll connect you with a human agent. Please wait a moment... 👨‍💼`;
      await updateSession(user.id, 'handover', context);
      await notificationService.createNotification({
        businessId,
        type: 'handover_request',
        title: `🚨 ${contactName || phone} requested support`,
        body: `Customer needs human assistance.`,
        link: '/conversations',
        customerId: user.id,
        customerName: contactName || phone,
      });
      break;
      
    case 'browse_menu':
      reply = "I can show you our top categories. Which one would you like to see?";
      const cats = await productService.getCategories(businessId);
      // Simplify: just show top categories
      break;
  }

  const categories = await productService.getCategories(businessId);

  if (!reply) {
    reply = await aiService.generateReply({
      userMessage: messageText,
      language: language,
      intent,
      businessName,
      products,
      categories,
      sessionContext: { state: session.state, ...context },
      history: history.slice(-5),
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
