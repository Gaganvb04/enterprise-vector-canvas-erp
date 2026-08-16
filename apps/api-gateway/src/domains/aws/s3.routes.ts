import { Router } from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const router = Router();

// Initialize AWS S3 Client with regional config
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'vector-assets-prod-storage';

/**
 * GET /api/aws/s3/presigned-upload-url
 * Generates an AWS S3 Presigned URL for secure client-side asset upload.
 */
router.get('/presigned-upload-url', async (req, res) => {
  try {
    const filename = (req.query.filename as string) || `asset-${Date.now()}.svg`;
    const contentType = (req.query.contentType as string) || 'image/svg+xml';
    const key = `vector-designs/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // Generate 15-minute presigned upload URL
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    res.json({
      success: true,
      presignedUrl,
      fileKey: key,
      cdnUrl: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`,
    });
  } catch (error: any) {
    console.error('AWS S3 Presigned URL Error:', error);
    res.status(500).json({ error: 'Failed to generate AWS S3 presigned URL' });
  }
});

export default router;
