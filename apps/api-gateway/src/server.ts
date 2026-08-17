import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './domains/auth/auth.routes';
import orderRoutes from './domains/orders/order.routes';
import inventoryRoutes from './domains/inventory/inventory.routes';
import printJobRoutes from './domains/orders/printjob.routes';
import templateRoutes from './domains/templates/template.routes';
import mobileRoutes from './domains/mobile/mobile.routes';
import issueRoutes from './domains/issues/issue.routes';
import userRoutes from './domains/auth/user.routes';
import catalogRoutes from './domains/catalog/catalog.routes';
import requestsRoutes from './domains/requests/requests.routes';
import configRoutes from './domains/config/config.routes';
import assemblyRoutes from './domains/orders/assembly.routes';
import aiRoutes from './domains/ai/ai.routes';
import s3Routes from './domains/aws/s3.routes';
import customerWorkflowRoutes from './domains/templates/customer-workflow.routes';

import Stripe from 'stripe';
import prisma from './lib/prisma';

dotenv.config();

process.on('unhandledRejection', (reason, promise) => {
  console.error('[WARN] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[WARN] Uncaught Exception thrown:', err);
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-04-10' as any,
});

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());

// Stripe Webhook MUST be before express.json()
app.post('/api/orders/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

  let event;
  try {
    if (!sig || endpointSecret === 'whsec_placeholder') {
      // Mock mode or missing secret, bypass signature check
      event = JSON.parse(req.body.toString());
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    
    // Only process if we didn't already mock process it.
    if (session.payment_status === 'paid') {
      try {
        const userId = session.client_reference_id;
        const totalAmount = session.amount_total / 100;
        let items = [];
        if (session.metadata && session.metadata.cartItems) {
           items = JSON.parse(session.metadata.cartItems);
        }

        const orderNumber = `RM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        
        // This is safe because if we mock it, we don't trigger the webhook. If we trigger the webhook, it's real.
        await prisma.$transaction(async (tx) => {
          const newOrder = await tx.order.create({
            data: { orderNumber, userId, totalAmount, status: 'PENDING', paymentStatus: 'PAID' }
          });
          if (items && items.length > 0) {
            await tx.orderItem.createMany({
              data: items.map((item: any) => ({
                orderId: newOrder.id, productType: item.t || 'COMBO', productId: item.p || 'unknown', quantity: item.q || 1, price: item.pr || 0
              }))
            });
          }
          await tx.printJob.create({
            data: { orderId: newOrder.id, templateId: 'custom-template', paperType: '350 GSM Matte', finish: 'Standard', status: 'QUEUE', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
          });
          const needsAssembly = items.some((item: any) => ['GROW_KIT', 'COMBO'].includes(item.t));
          if (needsAssembly) {
            const types = items.map((i: any) => i.t).filter((t: string) => ['GROW_KIT', 'COMBO'].includes(t));
            const primaryType = types.includes('COMBO') ? 'Combo' : 'Grow Kit';
            await tx.assemblyTask.create({
              data: {
                orderId: newOrder.id,
                type: primaryType,
                status: 'New',
                assignedTo: 'Unassigned',
                department: primaryType === 'Combo' ? 'General' : 'Grow Kit',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                notes: `${primaryType} assembly required for order ${orderNumber}`,
                checklist: [
                  { label: 'Check stock levels', done: false },
                  { label: 'Assemble grow kit components', done: false },
                  { label: 'Attach event QR code tags', done: false },
                  { label: 'Perform quality check', done: false },
                  { label: 'Secure packaging', done: false }
                ]
              }
            });
          }
        });
        console.log(`Order ${orderNumber} securely created via Stripe Webhook!`);
      } catch (dbErr) {
        console.error('Failed to create order from webhook:', dbErr);
      }
    }
  }

  res.send();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/print-jobs', printJobRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/users', userRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/assembly-tasks', assemblyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/customer-workflow', customerWorkflowRoutes);
app.use('/api/aws/s3', s3Routes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Gateway is running smoothly.' });
});

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`API Gateway listening at http://0.0.0.0:${port}`);
});
