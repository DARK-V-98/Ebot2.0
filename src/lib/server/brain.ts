import * as aiService from './aiService';
import * as userService from './userService';
import * as messageService from './messageService';
import * as productService from './productService';
import * as orderService from './orderService';
import * as whatsappService from './whatsappService';
import { db } from '../firebase/firebaseAdmin';

export async function getSession(customerId: string) {
  const docRef = db.collection('sessions').doc(customerId);
  const doc = await docRef.get();
  
  if (doc.exists) {
    return { id: doc.id, ...doc.data() };
  }

  const now = new Date().toISOString();
  await docRef.set({
    customer_id: customerId,
    state: 'idle',
    context_json: '{}',
    last_active: now
  });

  const fresh = await docRef.get();
  return { id: fresh.id, ...fresh.data() };
}

export async function updateSession(customerId: string, state: string, context = {}) {
  await db.collection('sessions').doc(customerId).update({
    state,
    context_json: JSON.stringify(context),
    last_active: new Date().toISOString()
  });
}

export async function processMessage({ businessId, businessName, phone, contactName, messageText, whatsappMsgId, isSimulation = false }: any) {
  const customer: any = await userService.findOrCreateCustomer(businessId, phone, contactName);

  const { language, intent, extracted_keywords } = await aiService.detectLanguageAndIntent(messageText);

  if (language !== 'unknown' && customer.language !== language) {
    await userService.updateCustomerLanguage(customer.id, language);
  }

  await messageService.saveMessage({
    businessId,
    customerId: customer.id,
    message: messageText,
    direction: 'in',
    intent,
    language,
    whatsappMsgId,
  });

  const session: any = await getSession(customer.id);
  const context = session.context_json
    ? (typeof session.context_json === 'string' ? JSON.parse(session.context_json) : session.context_json)
    : {};
  const history = await messageService.getHistory(customer.id, 10);

  let newState = session.state;
  let products: any[] = [];

  switch (intent) {
    case 'greeting':
      newState = 'browsing';
      context.last_intent = 'greeting';
      break;

    case 'search_product':
      newState = 'browsing';
      context.last_intent = 'search_product';
      products = await productService.searchProducts(businessId, extracted_keywords, 5);
      context.last_products = products.map((p: any) => p.id);
      break;

    case 'place_order': {
      newState = 'ordering';
      context.last_intent = 'place_order';

      if (extracted_keywords.length) {
        products = await productService.searchProducts(businessId, extracted_keywords, 3);
      } else if (context.last_products?.length) {
        for (const pid of context.last_products.slice(0, 3)) {
          const p = await productService.getProduct(businessId, pid);
          if (p) products.push(p);
        }
      }

      if (products.length === 1 && context.address) {
        try {
          const order: any = await orderService.createOrder({
            businessId,
            customerId: customer.id,
            productId:  products[0].id,
            quantity:   context.quantity || 1,
            address:    context.address,
          });
          context.last_order_id = order.id;
          newState = 'idle';
        } catch (err: any) {
          console.error('[brain] Order creation error:', err.message);
        }
      } else if (products.length === 1) {
        newState = 'awaiting_address';
        context.pending_product_id = products[0].id;
      }
      break;
    }

    case 'cancel':
      newState = 'idle';
      context.pending_product_id = null;
      context.cart = null;
      break;

    case 'help':
      newState = session.state;
      break;

    default:
      if (session.state === 'awaiting_address' && messageText.length > 5) {
        context.address = messageText;
        if (context.pending_product_id) {
          try {
            const order: any = await orderService.createOrder({
              businessId,
              customerId: customer.id,
              productId:  context.pending_product_id,
              quantity:   context.quantity || 1,
              address:    context.address,
            });
            context.last_order_id = order.id;
            context.pending_product_id = null;
            newState = 'idle';
          } catch (err: any) {
            console.error('[brain] Order creation error (address):', err.message);
          }
        }
      }
      break;
  }

  await updateSession(customer.id, newState, context);

  const reply = await aiService.generateReply({
    userMessage:     messageText,
    language:        language !== 'unknown' ? language : (customer.language || 'english'),
    intent,
    businessName,
    products,
    sessionContext:  { state: newState, ...context },
    history,
  });

  await messageService.saveMessage({
    businessId,
    customerId: customer.id,
    message:    reply,
    direction:  'out',
    intent:     null,
    language:   language !== 'unknown' ? language : customer.language,
  });

  if (!isSimulation) {
    if (products.length > 0 && intent === 'search_product') {
      const rows = products.slice(0, 10).map((p: any) => ({
        id: `prod_${p.id}`,
        title: p.name.substring(0, 24),
        description: `Rs.${p.price} | ${p.category || ''}`.substring(0, 72)
      }));

      await whatsappService.sendListMessage(
        businessId, 
        phone, 
        reply,
        'Select Product', 
        [{ title: 'Available Items', rows }]
      );
    } else {
      await whatsappService.sendMessage(businessId, phone, reply);
    }
  }

  return reply;
}
