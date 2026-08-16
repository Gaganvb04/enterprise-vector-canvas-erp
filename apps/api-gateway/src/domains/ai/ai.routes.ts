import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import prisma from '../../lib/prisma';

const router = Router();

router.post('/generate-design', authenticate, async (req: any, res) => {
  try {
    const { requestId } = req.body;
    
    // 1. Fetch the request details
    const customRequest = await prisma.customDesignRequest.findUnique({
      where: { id: requestId }
    });

    if (!customRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // 2. Simulate ML Generation Delay (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Return simulated beautifully designed 4-page layouts
    const generatedImages = [
      { page: 'Front Cover', url: 'https://images.unsplash.com/photo-1518331539958-385078508210?q=80&w=600&auto=format&fit=crop' },
      { page: 'Inside Left Page', url: 'https://images.unsplash.com/photo-1520638575003-9ea826c36195?q=80&w=600&auto=format&fit=crop' },
      { page: 'Inside Right Page', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop' },
      { page: 'Back Cover', url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600&auto=format&fit=crop' }
    ];

    // 4. Save to database
    const updatedRequest = await prisma.customDesignRequest.update({
      where: { id: requestId },
      data: {
        aiGeneratedDesigns: generatedImages
      } as any
    });

    res.json({ success: true, data: updatedRequest });
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate design' });
  }
});

export default router;
