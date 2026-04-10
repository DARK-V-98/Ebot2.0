require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() { 
  try { 
    if (!process.env.GEMINI_API_KEY) {
       console.log('No GEMINI_API_KEY found in .env.local!');
       return;
    }
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); 
    const result = await model.generateContent('Say hello if you are working'); 
    console.log('AI Response:', result.response.text()); 
  } catch (e) { 
    console.error('AI Error:', e.message); 
  } 
} 
test();
