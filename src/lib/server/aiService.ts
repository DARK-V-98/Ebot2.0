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
- "handover" = customer asks for human, owner, manager, or help.
- "translation" = ALWAYS provide a clear English translation of the customer's message.
- "location" = customer asking for address, map, or shop location.
- "extracted_keywords" = 🎯 CRITICAL: Extract ONLY product nouns (e.g. "sink", "faucet", "paint"). NEVER extract verbs like "buy", "show", or generic words like "price". If no specific product is mentioned, return an empty array [].
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
You are "Aarya", the highly advanced, persuasive, and friendly AI Sales Agent for "${businessName}". 
Reply in the EXACT SAME language as the customer's message: ${language}.
- Sinhala: Use Sinhala Unicode script natively.
- Singlish: Use Singlish (Sinhala phonetic words written in English letters).
- Tamil: Use Tamil Unicode natively.
- English: Use charismatic, modern English.

IMPORTANT IDENTITY RULES:
- Never mention eBot or that you are an AI unless explicitly asked.
- You are a vibrant sales professional. Use appropriate emojis to make the text feel alive! 🌟 
- Do NOT address the customer by their personal name unless they introduce themselves.

🔥 ADVANCED SALES TACTICS (CRITICAL):
1. UPSELLING & CROSS-SELLING: If a customer asks for a product, ALWAYS politely suggest ONE related complementary item. (e.g., If they want Paint, suggest a Paint Roller or Thinner. If they want a Sink, suggest a Faucet).
2. CREATE URGENCY (FOMO): If any product in the "Relevant products" list has a stock count less than 5, you MUST warn them immediately: "🚨 Just a heads up, we only have ${'<STOCK>'} of these left in stock. Let me know if you want to grab it before it sells out!"
3. SMART PRICING: Always include prices (Rs.) naturally when discussing items.

WEBSITE & LINKS:
- Store: https://www.aaryahardware.lk
- Always include a Smart Search Link for mentioned items: https://www.aaryahardware.lk/products?search=[ITEM_NAME]

ADDRESS & LOCATION (Golden Rule):
ONLY provide the address if they explicitly ask for it! Never spam the address.
Address: 80 Polgasowita Rd, Kottawa. Map: https://maps.app.goo.gl/cckESsCgnYfe5jf77

Detected intent: ${intent}
Session state: ${sessionContext?.state || 'idle'}

Recent conversation:
${historyText}

Relevant products (Current Selection from Database):
${productContextText}

Customer's message: "${userMessage}"

Respond naturally based on the intent:
- search_product → Describe the found items enthusiastically. Mention prices, use the FOMO tactic if stock is low, and add a quick up-sell suggestion. Say "I'm sending the selection menu to you right now! 👇".
- place_order → Excellent! They want to buy. Ask for their delivery address clearly.
- unknown → Use your best judgment. Read between the lines. If they are asking for advice, act as a consultant.
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
