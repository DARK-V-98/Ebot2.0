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
  "language": "english" | "sinhala" | "singlish",
  "intent": "greeting" | "search_product" | "place_order" | "check_order" | "help" | "cancel" | "unknown",
  "extracted_keywords": ["keyword1", "keyword2"],
  "confidence": 0.0-1.0
}

Rules:
- "sinhala" = pure Sinhala script (Unicode)
- "singlish" = Sinhala written in English letters (e.g., "mama eka ganna one")
- "english" = standard English
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
- If language is "english": reply in clear English.

Keep replies SHORT (max 3-4 sentences), warm, and action-oriented.
Use emojis naturally. Do NOT use markdown formatting.

Detected intent: ${intent}
Session state: ${sessionContext?.state || 'idle'}

Recent conversation:
${historyText}

Relevant products (Current Selection):
${productContextText}

Customer's message: "${userMessage}"

Respond naturally based on intent:
- greeting → welcome warmly, ask how you can help.
- search_product → if products are listed above, show them. Otherwise, ask what they are looking for.
- place_order → guide them through ordering (ask for address if not provided)
- check_order → ask for order ID or confirmation
- help → explain what the bot can do
- cancel → acknowledge and reset
- unknown → politely ask for clarification
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
