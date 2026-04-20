import * as admin from 'firebase-admin';
import { db } from '../firebase/firebaseAdmin';

export interface Correction {
  id?: string;
  business_id: string;
  trigger_keywords: string[];
  original_question: string;
  corrected_answer: string;
  language: string;
  created_at: string;
  usage_count: number;
}

/**
 * Save a manual correction from the dashboard
 */
export async function saveCorrection(params: {
  businessId: string;
  keywords: string[];
  question: string;
  answer: string;
  language: string;
}) {
  const now = new Date().toISOString();
  
  const docRef = await db.collection('ai_corrections').add({
    business_id: params.businessId,
    trigger_keywords: params.keywords.map(k => k.toLowerCase().trim()),
    original_question: params.question,
    corrected_answer: params.answer,
    language: params.language,
    created_at: now,
    usage_count: 0
  });

  return { id: docRef.id };
}

/**
 * Find the best matching correction for a given user message
 */
export async function findMatchingCorrection(businessId: string, message: string) {
  const text = message.toLowerCase();
  
  // Get all corrections for this business
  const snapshot = await db.collection('ai_corrections')
    .where('business_id', '==', businessId)
    .get();

  if (snapshot.empty) return null;

  const corrections = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  // Filter for corrections where ANY trigger keyword matches the message
  const match = corrections.find(c => 
    c.trigger_keywords.some((k: string) => text.includes(k))
  );

  if (match) {
    // Increment usage count asynchronously
    db.collection('ai_corrections').doc(match.id).update({
      usage_count: admin.firestore.FieldValue.increment(1)
    }).catch(() => {});
    
    return match.corrected_answer;
  }

  return null;
}
