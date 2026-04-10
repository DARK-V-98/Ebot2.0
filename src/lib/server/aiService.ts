import { GoogleGenerativeAI } from '@google/generative-ai';

// Auto-scrub the key to remove accidental spaces or newlines that break the API
const rawKey = process.env.GEMINI_API_KEY || '';
const cleanKey = rawKey.replace(/['"]+/g, '').trim();

const genAI = new GoogleGenerativeAI(cleanKey);

export async function detectLanguageAndIntent(messageText: string) {
  const modelsToTry = [
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-exp',
    'gemini-pro'
  ];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
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
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch (err: any) {
      console.warn(`[aiService] ${modelName} failed:`, err.message);
      lastError = err;
    }
  }

  console.error('[aiService] All models failed in detectLanguageAndIntent');
  return { language: 'unknown', intent: 'unknown', extracted_keywords: [], confidence: 0 };
}

export async function generateReply({ userMessage, language, intent, businessName, products, sessionContext, history }: any) {
  const modelsToTry = [
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash-exp',
    'gemini-pro'
  ];
  let lastError = null;

  const productList = products && products.length
    ? products.map((p: any) => `- ${p.name}: Rs.${p.price} (${p.category || 'General'})`).join('\n')
    : 'No products found.';

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

Available products:
${productList}

Customer's message: "${userMessage}"

Respond naturally based on intent:
- greeting → welcome warmly, ask how you can help
- search_product → show relevant products from the list above
- place_order → guide them through ordering (ask for address if not provided)
- check_order → ask for order ID or confirmation
- help → explain what the bot can do
- cancel → acknowledge and reset
- unknown → politely ask for clarification
`;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err: any) {
      console.warn(`[aiService] ${modelName} failed in generateReply:`, err.message);
      lastError = err;
    }
  }

  return `⚠️ AI Error: All models failed. Last error: ${lastError?.message}`;
}
