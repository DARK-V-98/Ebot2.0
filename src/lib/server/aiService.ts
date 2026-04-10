import { GoogleGenerativeAI } from '@google/generative-ai';

// Auto-scrub keys to remove accidental spaces or newlines
const cleanKey = (key: string) => (key || '').replace(/['"]+/g, '').trim();

// Force v1 Stable API for paid/high-tier accounts
const genAI = new GoogleGenerativeAI(cleanKey(process.env.GEMINI_API_KEY || ''));

export async function detectLanguageAndIntent(messageText: string) {
  const geminiModels = [
    'models/gemini-2.5-flash',
    'models/gemini-2.5-pro',
    'models/gemini-3.1-pro-preview',
    'models/gemini-flash-latest',
    'models/gemini-pro-latest'
  ];

  const prompt = `
You are a language and intent classifier for a WhatsApp commerce bot.
Analyze the following message and respond ONLY with valid JSON (no markdown, no extra text).

Message: "${messageText.replace(/"/g, "'")}"

Return JSON in this exact format:
{
  "language": "english" | "sinhala" | "singlish" | "tamil",
  "intent": "greeting" | "search_product" | "place_order" | "check_order" | "location" | "help" | "cancel" | "handover" | "unknown",
  "translation": "Literal English translation of the user's message",
  "extracted_keywords": ["keyword1", "keyword2"],
  "confidence": 0.0-1.0
}

Rules:
- "sinhala" = pure Sinhala script (Unicode)
- "singlish" = Sinhala written in English letters (e.g., "mama eka ganna one")
- "tamil" = pure Tamil script (Unicode)
- "english" = standard English
- "handover" = customer asks for human, owner, manager, or help from a person.
- "translation" = ALWAYS provide a clear English translation of the customer's message.
- "location" = customer asking for address, map, or shop location.
- Detect intent from context: product mentions = search_product, buy/order/ganna = place_order
`;

  // Try Gemini models first
  for (const modelName of geminiModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch (err: any) {
      console.warn(`[aiService] Gemini ${modelName} failed:`, err.message);
    }
  }

  console.error('[aiService] All Gemini models failed in detectLanguageAndIntent');
  return { language: 'unknown', intent: 'unknown', extracted_keywords: [], confidence: 0 };
}

export async function generateReply({ userMessage, language, intent, businessName, products, sessionContext, history }: any) {
  const geminiModels = [
    'models/gemini-2.5-flash',
    'models/gemini-2.5-pro',
    'models/gemini-3.1-pro-preview',
    'models/gemini-flash-latest',
    'models/gemini-pro-latest'
  ];

  // SMART FILTERING: Only show full details for relevant products (max 10)
  // Otherwise, just show a summary of categories to save tokens
  let productContextText = 'No products found.';
  
  if (products && products.length > 0) {
    const topProducts = products.slice(0, 10);
    productContextText = topProducts.map((p: any) => `- ${p.name}: Rs.${p.price} (${p.category || 'General'})`).join('\n');
    
    if (products.length > 10) {
      productContextText += `\n...and ${products.length - 10} more items in stock.`;
    }
  } else {
    // If no specific products are found, provide a list of categories as a guide
    productContextText = "We have items in various categories. Please ask for a specific item to see details.";
  }

  const historyText = history && history.length
    ? history.slice(-6).map((m: any) => `${m.direction === 'in' ? 'Customer' : 'Bot'}: ${m.message}`).join('\n')
    : '';

  const prompt = `
You are a friendly WhatsApp shopping assistant for "${businessName}".
Reply in the SAME language as the customer's message: ${language}.
- If language is "sinhala": reply in Sinhala Unicode script.
- If language is "singlish": reply in Singlish (Sinhala words in English letters).
- If language is "tamil": reply in Tamil Unicode script.
- If language is "english": reply in clear English.

IMPORTANT: You are the SALES assistant named "Aarya" for "Aarya Bathware". Never mention eBot or any other name.
Do NOT address the customer by their personal name.

SALES RULES:
- WEBSITE: https://www.aaryahardware.lk
- If products are listed in the "Relevant products" section below, your job is to MENTION them briefly and tell the customer you are sending a selection menu below.
- INVENTORY ALERT: If any product listed below has stock less than 5, you MUST warn the customer (e.g., "Only 3 left in stock!").
- For every specific product you mention, PROVIDE a Smart Search Link like this: https://www.aaryahardware.lk/products?search=[ITEM_NAME] (Replace [ITEM_NAME] with the actual product name).
- Always include prices (Rs.) when talking about products.
- Tell customers they can see more details and photos at: https://www.aaryahardware.lk/products

ADDRESS & LOCATION (Golden Rule):
ONLY provide the address and map link if the customer explicitly asks for the location/address, OR if it's the very first message of the conversation. Do NOT repeat it in every reply.
Aarya Bathware, 80 Polgasowita Rd, Kottawa. Map Link: https://maps.app.goo.gl/cckESsCgnYfe5jf77

Detected intent: ${intent}
Session state: ${sessionContext?.state || 'idle'}

Recent conversation:
${historyText}

Relevant products (Current Selection):
${productContextText}

Customer's message: "${userMessage}"

Respond as a focused salesperson:
- greeting → welcome to Aarya Bathware, I'm Aarya! Include address once, then ask what items they need today.
- search_product → Describe the items found and say "Sending you the selection list with prices now...". Do NOT include address unless asked.
- location → provide the Aarya Bathware address and map link.
- handover → acknowledge that you are connecting them to the owner/staff and wish them a good day.
- place_order → ask for address.
- unknown → If they are asking for items or prices, describe what you have and say "Sending the list now...". Do NOT include address.
- general_chat → Keep it short and friendly. Do NOT include address.
`;

  // Try Gemini models first
  let lastGeminiError = '';
  for (const modelName of geminiModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err: any) {
      console.warn(`[aiService] Gemini ${modelName} failed in generateReply:`, err.message);
      lastGeminiError = err.message;
    }
  }

  return `⚠️ AI Error: All Gemini models failed. (Last Gemini error: ${lastGeminiError})`;
}
