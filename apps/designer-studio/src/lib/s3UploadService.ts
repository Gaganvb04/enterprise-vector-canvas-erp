/**
 * S3 Upload Service
 * ─────────────────────────────────────────────────────────────
 * Orchestrates the 2-step AWS S3 presigned upload flow:
 *   1. GET presigned URL from API Gateway
 *   2. PUT file directly to S3 using the presigned URL
 *
 * Falls back to local FileReader (base64) in mock/dev mode or on error.
 */

const API_BASE = 'http://localhost:4000';

export interface S3UploadResult {
  /** The final src to use on the canvas — either a CDN URL or a base64 data URL */
  src: string;
  /** True when the file was successfully pushed to real AWS S3 */
  uploadedToS3: boolean;
  /** The S3 object key (only set when uploadedToS3 is true) */
  s3Key?: string;
  /** The public CDN/S3 URL (only set when uploadedToS3 is true) */
  cdnUrl?: string;
}

/** Read a file as a base64 data URL (local fallback) */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Read an SVG file as raw text (local fallback) */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Resolves the MIME content-type for the upload.
 */
function getContentType(file: File): string {
  if (file.type) return file.type;
  if (file.name.endsWith('.svg')) return 'image/svg+xml';
  if (file.name.endsWith('.png')) return 'image/png';
  if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) return 'image/jpeg';
  if (file.name.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

/**
 * Uploads a file using the 2-step S3 presigned URL flow.
 * Falls back to local base64 encoding if:
 *   - The API gateway is in mock mode (no real AWS credentials)
 *   - Network error fetching presigned URL
 *   - S3 PUT fails
 */
export async function uploadFileToS3(file: File): Promise<S3UploadResult> {
  const contentType = getContentType(file);
  const isSvg = contentType.includes('svg') || file.name.endsWith('.svg');

  // ── Step 1: Request presigned URL from API Gateway ─────────────────────────
  let presignedUrlData: {
    success: boolean;
    mock: boolean;
    presignedUrl: string | null;
    fileKey: string;
    cdnUrl: string | null;
    message?: string;
  } | null = null;

  try {
    const params = new URLSearchParams({
      filename: file.name,
      contentType,
    });
    const response = await fetch(`${API_BASE}/api/aws/s3/presigned-upload-url?${params}`, {
      method: 'GET',
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (response.ok) {
      presignedUrlData = await response.json();
    }
  } catch (err) {
    console.warn('[S3 Upload] Could not reach API Gateway for presigned URL:', err);
    // Fall through to local fallback
  }

  // ── Step 2a: Mock mode or API Gateway unreachable → local fallback ─────────
  const isMockMode = !presignedUrlData || presignedUrlData.mock || !presignedUrlData.presignedUrl;

  if (isMockMode) {
    console.info('[S3 Upload] Using local FileReader fallback (mock mode).');
    const src = isSvg
      ? await readFileAsText(file)
      : await readFileAsDataUrl(file);

    return {
      src,
      uploadedToS3: false,
    };
  }

  // Narrow to non-null: after isMockMode guard above, we know presignedUrlData
  // is defined and presignedUrl is a real string.
  const realData = presignedUrlData as NonNullable<typeof presignedUrlData> & { presignedUrl: string; cdnUrl: string };

  // ── Step 2b: Real mode → PUT directly to S3 via presigned URL ─────────────
  try {
    const putResponse = await fetch(realData.presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    });

    if (!putResponse.ok) {
      throw new Error(`S3 PUT failed with status ${putResponse.status}`);
    }

    console.info(`[S3 Upload] Successfully uploaded to S3: ${realData.fileKey}`);

    return {
      src: realData.cdnUrl,
      uploadedToS3: true,
      s3Key: realData.fileKey,
      cdnUrl: realData.cdnUrl,
    };
  } catch (err) {
    console.warn('[S3 Upload] S3 PUT failed, falling back to local FileReader:', err);

    // Fallback: still add the asset locally even if S3 PUT fails
    const src = isSvg
      ? await readFileAsText(file)
      : await readFileAsDataUrl(file);

    return {
      src,
      uploadedToS3: false,
    };
  }
}

/**
 * Notifies the API Gateway to delete an S3 object when a user removes an upload.
 * Fire-and-forget: does not throw on failure.
 */
export async function deleteS3Object(s3Key: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/aws/s3/object`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey: s3Key }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.warn('[S3 Upload] Failed to delete S3 object (non-fatal):', err);
  }
}

/**
 * Checks the current S3 mode (real vs mock) from the API Gateway.
 * Useful for displaying status badges in the UI.
 */
export async function getS3Status(): Promise<{ mode: 'real' | 'mock'; bucket?: string; region?: string; message: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/aws/s3/status`, {
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) return response.json();
  } catch (_) {}
  return { mode: 'mock', message: 'API Gateway unreachable — running in offline mode.' };
}
