import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { db } from '@/lib/firebase/firebaseAdmin';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Gather some data for the AI to analyze
    const [ordersSnap, messagesSnap, customersSnap] = await Promise.all([
      db.collection('orders').where('business_id', '==', business.id).limit(10).get(),
      db.collection('messages').where('business_id', '==', business.id).limit(20).get(),
      db.collection('customers').where('business_id', '==', business.id).count().get()
    ]);

    const orders = ordersSnap.docs.map(d => ({ total: d.data().total_amount, status: d.data().status }));
    const messages = messagesSnap.docs.map(d => d.data().message);
    const totalCustomers = customersSnap.data().count;

    const summaryData = {
      totalCustomers,
      recentOrders: orders,
      recentMessages: messages.slice(0, 10)
    };

    // 2. Ask Gemini for an "Advanced Business Insight"
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `
      You are an expert business analyst for a company called "${business.name}".
      Based on the following live data from their WhatsApp AI chatbot, provide 2 short, actionable "Advanced Insights".
      One insight about customer behavior/trends, and one about revenue/orders.
      Keep them professional, data-driven, and very short (max 20 words each).
      
      Data: ${JSON.stringify(summaryData)}
      
      Return ONLY valid JSON:
      {
        "insights": [
          {"id": 1, "type": "trend", "text": "Insight text here..."},
          {"id": 2, "type": "revenue", "text": "Insight text here..."}
        ],
        "sentiment": "positive" | "neutral" | "needs-attention"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, '').trim();

    return NextResponse.json(JSON.parse(cleanJson));
  } catch (err: any) {
    console.error('[ai-insights]', err.message);
    return NextResponse.json({ 
      insights: [
        { id: 1, type: 'trend', text: 'Gathering more data to provide your first AI business insight.' },
        { id: 2, type: 'revenue', text: 'Set up your WhatsApp bot to start tracking revenue trends.' }
      ],
      sentiment: 'neutral'
    });
  }
}
