import { Router } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth.middleware';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-04-10' as any,
});

const router = Router();

router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrdersToday, pendingQC, readyDispatch, openIssues] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.printJob.count({ where: { status: 'PRINTED' } }), // Assuming PRINTED means it needs QC
      prisma.order.count({ where: { status: 'SHIPPED' } }), // Or 'PROCESSING'
      prisma.issue.count({ where: { status: 'Open' } })
    ]);

    // Also get last 7 days order trend
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const recentOrders = await prisma.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true }
    });

    // Group by day
    const trendMap: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      trendMap[dateStr] = 0;
    }

    recentOrders.forEach(o => {
      const dateStr = o.createdAt.toISOString().split('T')[0];
      if (trendMap[dateStr] !== undefined) {
        trendMap[dateStr]++;
      }
    });

    const trend = Object.keys(trendMap).map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      orders: trendMap[date]
    }));

    res.json({
      data: {
        totalOrdersToday,
        pendingQC,
        readyDispatch,
        openIssues,
        trend
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Dispatch Queue Route for Operations Portal
router.get('/dispatch-queue', async (req, res) => {
  try {
    let orders = await prisma.order.findMany({
      include: {
        items: true,
        user: { select: { name: true, email: true, phone: true, address: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (orders.length === 0) {
      const seedUser = await prisma.user.findFirst();
      const newOrder = await prisma.order.create({
        data: {
          orderNumber: `RM-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          userId: seedUser?.id || '',
          totalAmount: 14500,
          status: 'Packaging',
          paymentStatus: 'PAID'
        }
      });
      await prisma.orderItem.create({
        data: {
          orderId: newOrder.id,
          productType: 'COMBO',
          productId: 'combo-royal-heritage',
          quantity: 100,
          price: 14500
        }
      });
      orders = await prisma.order.findMany({
        include: {
          items: true,
          user: { select: { name: true, email: true, phone: true, address: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Fetch Dispatch Queue Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let whereClause = {};
    if (userRole === 'CUSTOMER') {
      whereClause = { userId };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: orders });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/admin-stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const [allOrders, customerCount] = await Promise.all([
      prisma.order.findMany({
        include: { items: true }
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } })
    ]);

    const totalRevenue = allOrders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const activeOrders = allOrders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length;

    const growKitsShipped = allOrders
      .filter(o => o.status === 'DELIVERED' || o.status === 'Delivered')
      .flatMap(o => o.items)
      .filter(i => i.productType === 'GROW_KIT')
      .reduce((sum, i) => sum + i.quantity, 0);

    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap: Record<string, { month: string; revenue: number; orders: number }> = {};
    
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mName = monthsShort[d.getMonth()];
      monthlyMap[mName] = { month: mName, revenue: 0, orders: 0 };
    }

    allOrders.forEach(o => {
      const d = new Date(o.createdAt);
      const mName = monthsShort[d.getMonth()];
      if (monthlyMap[mName]) {
        monthlyMap[mName].orders++;
        if (o.status !== 'Cancelled') {
          monthlyMap[mName].revenue += o.totalAmount;
        }
      }
    });

    const trend = Object.values(monthlyMap);

    const todayStr = today.toDateString();
    const proofsAwaitingApproval = allOrders.filter(o => o.status === 'Proof Ready' || o.status === 'Designing').length;
    const ordersPendingAssignment = allOrders.filter(o => ['New Enquiry', 'PENDING', 'Confirmed'].includes(o.status)).length;
    const readyForDispatch = allOrders.filter(o => ['Packaging', 'QC', 'Approved'].includes(o.status)).length;
    const newOrdersToday = allOrders.filter(o => new Date(o.createdAt).toDateString() === todayStr).length;

    res.json({
      success: true,
      data: {
        totalRevenue,
        activeOrders,
        totalCustomers: customerCount,
        growKitsShipped,
        trend,
        actionQueue: {
          proofsAwaitingApproval,
          ordersPendingAssignment,
          readyForDispatch,
          newOrdersToday
        }
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    const order = await prisma.order.findUnique({
      where: { id: req.params.id as string },
      include: {
        items: true,
        user: {
          select: { name: true, email: true, phone: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Admins can view any order; customers only their own
    if (!isAdmin && order.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Order Status (Internal Ops & Admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id as string;
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status }
    });
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { items, totalAmount } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const orderNumber = `RM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create as PENDING and UNPAID
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          totalAmount,
          status: 'New Enquiry',
          paymentStatus: 'UNPAID', // It's an enquiry
        }
      });

      if (items && items.length > 0) {
        await tx.orderItem.createMany({
          data: items.map((item: any) => ({
            orderId: newOrder.id,
            productType: item.type || 'COMBO',
            productId: item.productId || 'unknown',
            quantity: item.quantity || 1,
            price: item.price || 0,
            metadata: item.metadata || null,
          }))
        });

        const hasInvitation = items.some((i: any) => ['INVITATION', 'COMBO', 'PRINT_FINISH'].includes(i.type));
        if (hasInvitation) {
          await tx.printJob.create({
            data: {
              orderId: newOrder.id,
              templateId: 'custom-template',
              paperType: '350 GSM Matte',
              finish: 'Standard',
              status: 'QUEUE',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          });
        }

        const needsAssembly = items.some((i: any) => ['GROW_KIT', 'COMBO', 'DELIVERY', 'PACKAGING'].includes(i.type));
        if (needsAssembly) {
          const isVip = items.some((i: any) => i.type === 'DELIVERY' && i.metadata?.vip);
          const primaryType = items.some((i: any) => i.type === 'COMBO') ? 'Combo' : 'Grow Kit';
          await tx.assemblyTask.create({
            data: {
              orderId: newOrder.id,
              type: primaryType,
              status: 'New',
              assignedTo: 'Unassigned',
              department: primaryType === 'Combo' ? 'General' : 'Grow Kit',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              notes: `${primaryType} assembly required for order ${orderNumber}${isVip ? ' | VIP Hand Delivery requested!' : ''}`,
              checklist: [
                { label: 'Check stock levels & allocations', done: false },
                { label: 'Assemble grow kit components', done: false },
                { label: 'Attach event QR code tags', done: false },
                { label: 'Perform quality check', done: false },
                { label: isVip ? 'Prepare VIP Hand Delivery distribution package' : 'Secure standard packaging', done: false }
              ]
            }
          });
        }
      }

      return { order: newOrder };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Redirect-based Stripe Checkout (Dormant)
router.post('/checkout-session', authenticate, async (req: AuthRequest, res) => {
  try {
    const { items, totalAmount } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder' || process.env.STRIPE_SECRET_KEY.trim() === '') {
      // MOCK MODE: If no real keys are provided, bypass Stripe and return a mock URL
      // We will instantly create the order here in mock mode.
      const orderNumber = `RM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: { orderNumber, userId, totalAmount, status: 'PENDING', paymentStatus: 'PAID' }
        });
        if (items && items.length > 0) {
          await tx.orderItem.createMany({
            data: items.map((item: any) => ({
              orderId: newOrder.id,
              productType: item.type || 'COMBO',
              productId: item.productId || 'unknown',
              quantity: item.quantity || 1,
              price: item.price || 0,
              metadata: item.metadata || null,
            }))
          });
        }
        await tx.printJob.create({
          data: { orderId: newOrder.id, templateId: 'custom-template', paperType: '350 GSM Matte', finish: 'Standard', status: 'QUEUE', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        });
        const needsAssembly = items.some((item: any) => ['GROW_KIT', 'COMBO'].includes(item.type));
        if (needsAssembly) {
          const types = items.map((i: any) => i.type).filter((t: string) => ['GROW_KIT', 'COMBO'].includes(t));
          const primaryType = types.includes('COMBO') ? 'Combo' : 'Grow Kit';
          const growKitItems = items.filter((i: any) => i.type === 'GROW_KIT');
          const allocationSummary = growKitItems
            .flatMap((i: any) => i.metadata?.growKitAllocations || [])
            .map((a: any) => `${a.name}: ${a.quantity}`)
            .join(', ');
          await tx.assemblyTask.create({
            data: {
              orderId: newOrder.id,
              type: primaryType,
              status: 'New',
              assignedTo: 'Unassigned',
              department: primaryType === 'Combo' ? 'General' : 'Grow Kit',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              notes: `${primaryType} assembly required for order ${orderNumber}${allocationSummary ? ` | Plant mix: ${allocationSummary}` : ''}`,
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
      
      return res.json({ url: `http://localhost:5173/success?order_number=${orderNumber}` });
    }

    // REAL STRIPE MODE
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.type || 'Rooted Memoirs Product',
          },
          unit_amount: Math.round(item.price * 100), // Stripe expects cents
        },
        quantity: item.quantity || 1,
      })),
      mode: 'payment',
      success_url: `http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/cancel`,
      client_reference_id: userId,
      metadata: {
        cartItems: JSON.stringify(items.map((i: any) => ({ t: i.type, p: i.productId, q: i.quantity, pr: i.price })))
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe Session Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
