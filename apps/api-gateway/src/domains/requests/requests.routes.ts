import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import prisma from '../../lib/prisma';

const router = Router();

// Post a custom design request
router.post('/custom-design', async (req: any, res) => {
  try {
    const { name, email, phone, details, attachments, eventType, quantity, eventDate } = req.body;
    const request = await prisma.customDesignRequest.create({
      data: { name, email, phone, details, attachments, eventType, quantity, eventDate }
    });
    res.status(201).json({ success: true, request });
  } catch (error) {
    console.error('Custom Design Request Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get all custom design requests
router.get('/custom-design', authenticate, async (req, res) => {
  try {
    const requests = await prisma.customDesignRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: requests });
  } catch (error) {
    console.error('Fetch Custom Design Requests Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Post a contact message
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const contact = await prisma.contactMessage.create({
      data: { name, email, message }
    });
    res.status(201).json({ success: true, contact });
  } catch (error) {
    console.error('Contact Message Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Get all contact messages
router.get('/contact', authenticate, async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ data: messages });
  } catch (error) {
    console.error('Fetch Contact Messages Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update custom design request status
router.patch('/custom-design/:id', authenticate, async (req: any, res) => {
  try {
    const { status } = req.body;
    const updated = await prisma.customDesignRequest.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update Design Request Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update contact message status
router.patch('/contact/:id', authenticate, async (req: any, res) => {
  try {
    const { status } = req.body;
    const updated = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update Contact Message Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;

