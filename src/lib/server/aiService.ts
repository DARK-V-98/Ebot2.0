import { GoogleGenerativeAI } from '@google/generative-ai';

// Auto-scrub keys to remove accidental spaces or newlines
const cleanKey = (key: string) => (key || '').replace(/['"]+/g, '').trim();

// Force v1 Stable API for paid/high-tier accounts
const genAI = new GoogleGenerativeAI(cleanKey(process.env.GEMINI_API_KEY || ''));

export async function detectLanguageAndIntent(messageText: string) {
  const geminiModels = [
    'models/gemini-2.5-flash',
    'models/gemini-2.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  const prompt = `
You are a language and intent classifier for a WhatsApp commerce bot.
Analyze the following message and respond ONLY with valid JSON (no markdown, no extra text).

Message: "${messageText.replace(/"/g, "'")}"

Return JSON in this exact format:
{
  "language": "english" | "sinhala" | "singlish" | "tamil",
  "intent": "greeting" | "search_product" | "location" | "help" | "cancel" | "handover" | "unknown",
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
- Detect intent from context: product mentions = search_product, help/info = help.
- 🚫 IMPORTANT: "place_order" intent is NO LONGER SUPPORTED. If a customer says they want to buy or "ganna", classify it as "search_product" or "unknown" and let the reply generator handle the redirect.
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

export async function generateReply({ userMessage, language, intent, businessName, products, categories, sessionContext, history }: any) {
  const geminiModels = [
    'models/gemini-2.5-flash',
    'models/gemini-2.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  // SMART FILTERING: Only show full details for relevant products (max 10)
  let productContextText = 'No products found.';
  
  if (products && products.length > 0) {
    const topProducts = products.slice(0, 10);
    productContextText = topProducts.map((p: any, idx: number) => `[Item ${idx + 1}] ${p.name} - ${p.category} - Rs.${p.price}`).join('\n');
    
    if (products.length > 10) {
      productContextText += `\n...and ${products.length - 10} more items in stock.`;
    }
  }

  // Include categories for context if no products are specifically requested
  const categoryContextText = categories && categories.length > 0 
    ? `Available Categories: ${categories.join(', ')}`
    : '';

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
1. UPSELLING & CROSS-SELLING: If a customer asks for a product, politely suggest ONE related complementary item.
2. NUMBERED SELECTION MENU: When listing multiple products from the "Current Selection" below, you MUST format them clearly as a numbered list (e.g., "1️⃣ Bathtub - Rs. 5000", "2️⃣ Faucet - Rs. 2000"). NEVER USE URL LINKS. Instead, instruct the customer to literally reply with the number (e.g., "Reply with 1 or 2 to see photos and purchase! 👇").
3. CREATE URGENCY (FOMO): If an item has low stock, mention it to create urgency!
4. SMART PRICING: Always include prices (Rs.) naturally when discussing items.

🔥 REDIRECTION POLICY (STRICT):
1. NO ORDERS IN BOT: You CANNOT take orders or ask for delivery addresses. 
2. CALL TO ACTION: If a customer decides to buy, you MUST tell them to visit our website at "https://aaryabathware.com" or visit our physical shop in Kottawa.
3. WE PROVIDE DETAILS: Your job is only to provide product info, photos, and guidance.

Detected intent: ${intent}
Session state: ${sessionContext?.state || 'idle'}

Current Categories:
${categoryContextText}

Recent conversation:
${historyText}

Relevant products (Current Selection from Database):
${productContextText}

🔥 PRODUCT MATCHING RULES:
1. If the customer sent an image (UserMessage starts with "User sent a image") AND the "Current Selection" above shows "No products found", you MUST say: "I couldn't identify this specific item in our current inventory. Please contact us via call at 076 123 4567 to send more details or check for custom orders! 📞"
2. If products are found, identify which one looks closest to the image and describe it.

Customer's message: "${userMessage}"

Respond naturally based on the intent:
- search_product → Describe the items enthusiastically. Mention prices. Say "I'm sending the selection menu to you right now! 👇".
- buying_interest → Congratulate them and redirect to Website (https://aaryabathware.com) or Shop in Kottawa.
- unknown → Act as a helpful consultant.
- BACK BUTTON: Frequently remind the customer they can reply with "Back" to see the previous menu or "0" for the main menu.
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
