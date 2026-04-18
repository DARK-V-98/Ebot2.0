import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/server/auth';
import { db } from '@/lib/firebase/firebaseAdmin';

export async function POST(req: NextRequest) {
  const business = await requireAuth(req);
  if (!business) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const businessId = business.id;
    
    // Batch delete helper
    const deleteCollection = async (collectionName: string) => {
      let queryItem;
      if(collectionName === 'sessions') {
         // Sessions might not have business_id easily indexed, but they map 1:1 with customers.
         // Let's just fetch all customers to delete their sessions
         const customersSnap = await db.collection('customers').where('business_id', '==', businessId).get();
         const batch = db.batch();
         customersSnap.docs.forEach(doc => {
            batch.delete(db.collection('sessions').doc(doc.id));
         });
         await batch.commit();
         return;
      }
      
      const snap = await db.collection(collectionName).where('business_id', '==', businessId).get();
      if (snap.empty) return;
      
      // Firestore batches support up to 500 operations
      const batches = [];
      let currentBatch = db.batch();
      let operationCount = 0;

      snap.docs.forEach(doc => {
        currentBatch.delete(doc.ref);
        operationCount++;

        if (operationCount === 490) {
          batches.push(currentBatch.commit());
          currentBatch = db.batch();
          operationCount = 0;
        }
      });

      if (operationCount > 0) {
        batches.push(currentBatch.commit());
      }

      await Promise.all(batches);
    };

    await deleteCollection('sessions');
    await deleteCollection('messages');
    await deleteCollection('customers');
    await deleteCollection('notifications');

    return NextResponse.json({ success: true, message: 'All chat data initialized.' });
  } catch (err: any) {
    console.error('[clear-chats] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
