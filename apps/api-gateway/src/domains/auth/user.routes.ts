import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate } from '../../middleware/auth.middleware';
import prisma from '../../lib/prisma';

const router = Router();

// ─── Get Current User Profile ───────────────────────────────────────────────
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, phone: true, address: true, role: true, cartData: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Update Current User Profile ────────────────────────────────────────────
router.put('/me', authenticate, async (req: any, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone, address },
      select: { id: true, email: true, name: true, phone: true, address: true, role: true, createdAt: true }
    });
    res.json({ success: true, user });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Update Cart ─────────────────────────────────────────────────────────────
router.put('/me/cart', authenticate, async (req: any, res) => {
  try {
    const { cartData } = req.body;
    await prisma.user.update({
      where: { id: req.user.id },
      data: { cartData }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Update Cart Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Wishlist ─────────────────────────────────────────────────────────────────
router.get('/me/wishlist', authenticate, async (req: any, res) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    const catalogIds = items.map(i => i.productId);
    const catalogItems = await prisma.catalogItem.findMany({
      where: { id: { in: catalogIds } }
    });
    const populated = items.map(item => ({
      ...item,
      product: catalogItems.find(c => c.id === item.productId)
    }));
    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Fetch Wishlist Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/me/wishlist', authenticate, async (req: any, res) => {
  try {
    const { productId, productType } = req.body;
    if (!productId || !productType) {
      return res.status(400).json({ error: 'productId and productType are required' });
    }
    const item = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: {},
      create: { userId: req.user.id, productId, productType }
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Add Wishlist Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/me/wishlist/:productId', authenticate, async (req: any, res) => {
  try {
    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId: req.user.id, productId: req.params.productId } }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete Wishlist Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Admin: List All Users ────────────────────────────────────────────────────
router.get('/', authenticate, async (req: any, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Fetch All Users Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Admin: Invite / Create New User ─────────────────────────────────────────
router.post('/invite', authenticate, async (req: any, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, email, phone, role, password } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'name, email, and role are required.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Default password if not provided
    const rawPassword = password || 'RootedMemoirs@2026';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newUser = await prisma.user.create({
      data: { name, email, phone: phone || null, role, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true }
    });

    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error('Invite User Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Admin: Edit User Profile (name, phone, address) ─────────────────────────
router.put('/:id/profile', authenticate, async (req: any, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { name, phone, address } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name    !== undefined ? { name }    : {}),
        ...(phone   !== undefined ? { phone }   : {}),
        ...(address !== undefined ? { address } : {}),
      },
      select: { id: true, name: true, email: true, role: true, phone: true, address: true, createdAt: true }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Edit User Profile Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Admin: Change User Role ──────────────────────────────────────────────────
router.put('/:id/role', authenticate, async (req: any, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ error: 'role is required.' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Change Role Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── Admin: Deactivate / Activate User (toggle via status field note) ────────
// We store active state by setting role to 'INACTIVE' or back.
// Alternatively mark in a status field. For now we use a soft approach:
// PATCH /api/users/:id/status with { active: boolean }
router.patch('/:id/status', authenticate, async (req: any, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { active } = req.body;

    // We encode deactivation by prepending INACTIVE_ to the role
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let newRole = user.role;
    if (active === false && !user.role.startsWith('INACTIVE_')) {
      newRole = `INACTIVE_${user.role}`;
    } else if (active === true && user.role.startsWith('INACTIVE_')) {
      newRole = user.role.replace('INACTIVE_', '');
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: newRole },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Toggle User Status Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
