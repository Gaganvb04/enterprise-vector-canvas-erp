import { Router } from 'express';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const router = Router();

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'vector-assets-prod-storage';
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';

// Detect if real AWS credentials are configured
const IS_MOCK_MODE =
  !AWS_ACCESS_KEY_ID ||
  AWS_ACCESS_KEY_ID.startsWith('AKIAIOSFODNN7EXAMPLE') ||
  !AWS_SECRET_ACCESS_KEY;

// Initialize AWS S3 Client with regional config (only when credentials are present)
let s3Client: S3Client | null = null;
if (!IS_MOCK_MODE) {
  s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
}

if (IS_MOCK_MODE) {
  console.log(
    '[AWS S3] Running in MOCK MODE — no real AWS credentials detected. ' +
    'Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME in .env to enable real S3 uploads.'
  );
}

// ─── GET /api/aws/s3/presigned-upload-url ────────────────────────────────────
/**
 * Generates an AWS S3 Presigned URL for secure client-side asset upload.
 *
 * Query params:
 *   filename    — original file name (e.g. "rose-motif.svg")
 *   contentType — MIME type (e.g. "image/svg+xml", "image/png")
 *
 * Response (real mode):
 *   { success, presignedUrl, fileKey, cdnUrl, mock }
 *
 * Response (mock mode):
 *   { success, presignedUrl: null, fileKey, cdnUrl: null, mock: true }
 *   — frontend falls back to local FileReader approach
 */
router.get('/presigned-upload-url', async (req, res) => {
  try {
    const filename = (req.query.filename as string) || `asset-${Date.now()}.svg`;
    const contentType = (req.query.contentType as string) || 'image/svg+xml';
    const safeFilename = filename.replace(/[^a-zA-Z0-9._\-]/g, '_');
    const fileKey = `vector-designs/${Date.now()}-${safeFilename}`;

    // ── Mock Mode: return null presignedUrl so frontend falls back ──────────
    if (IS_MOCK_MODE) {
      return res.json({
        success: true,
        mock: true,
        presignedUrl: null,
        fileKey,
        cdnUrl: null,
        message:
          'Mock mode active — AWS credentials not configured. ' +
          'Add AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME to .env for real S3 uploads.',
      });
    }

    // ── Real Mode: generate 15-minute presigned PUT URL ──────────────────────
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client!, command, { expiresIn: 900 });
    const cdnUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`;

    return res.json({
      success: true,
      mock: false,
      presignedUrl,
      fileKey,
      cdnUrl,
    });
  } catch (error: any) {
    console.error('[AWS S3] Presigned URL generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate AWS S3 presigned URL',
      detail: error?.message || 'Unknown error',
    });
  }
});

// ─── DELETE /api/aws/s3/object ────────────────────────────────────────────────
/**
 * Deletes an S3 object by key (when user removes an uploaded asset).
 *
 * Body: { fileKey: string }
 */
router.delete('/object', async (req, res) => {
  if (IS_MOCK_MODE) {
    return res.json({ success: true, mock: true, message: 'Mock mode: no S3 deletion performed.' });
  }

  const { fileKey } = req.body as { fileKey?: string };
  if (!fileKey) {
    return res.status(400).json({ success: false, error: 'fileKey is required' });
  }

  try {
    const command = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey });
    await s3Client!.send(command);
    return res.json({ success: true, fileKey });
  } catch (error: any) {
    console.error('[AWS S3] Object deletion error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete S3 object',
      detail: error?.message || 'Unknown error',
    });
  }
});

// ─── GET /api/aws/s3/status ───────────────────────────────────────────────────
/**
 * Returns the current S3 configuration status (real vs mock mode).
 */
router.get('/status', (_req, res) => {
  res.json({
    mode: IS_MOCK_MODE ? 'mock' : 'real',
    region: IS_MOCK_MODE ? null : AWS_REGION,
    bucket: IS_MOCK_MODE ? null : BUCKET_NAME,
    message: IS_MOCK_MODE
      ? 'No AWS credentials configured — upload panel will use local FileReader fallback.'
      : `Connected to bucket: ${BUCKET_NAME} in region: ${AWS_REGION}`,
  });
});

export default router;
