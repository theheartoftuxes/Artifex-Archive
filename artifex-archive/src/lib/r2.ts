import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_BUCKET = process.env.R2_PUBLIC_BUCKET;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || (R2_PUBLIC_BUCKET ? `https://${R2_PUBLIC_BUCKET}.r2.dev` : "");

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_BUCKET) {
  console.warn("R2 environment variables are not fully configured");
}

// Create S3 client configured for Cloudflare R2
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Generate a presigned PUT URL for direct upload to R2
 * @param key - The object key (path) in the bucket
 * @param contentType - The content type of the file
 * @param expiresIn - Expiration time in seconds (default: 15 minutes)
 * @returns Presigned URL and public URL
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 15 * 60 // 15 minutes
) {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_BUCKET) {
    throw new Error("R2 configuration is missing");
  }

  const command = new PutObjectCommand({
    Bucket: R2_PUBLIC_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });
  const publicUrl = `${R2_PUBLIC_URL}/${key}`;

  // Generate thumbnail URL (same key + .thumb.jpg)
  // For now, we'll use the same URL structure - can be enhanced with Cloudflare Images later
  const thumbnailUrl = `${R2_PUBLIC_URL}/${key.replace(/\.[^/.]+$/, "")}.thumb.jpg`;

  return {
    uploadUrl,
    publicUrl,
    thumbnailUrl,
  };
}

/**
 * Generate a unique key for an uploaded file
 * Format: {userId}/{timestamp}-{random}-{filename}
 */
export function generateFileKey(
  userId: string,
  filename: string,
  mediaType: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const extension = filename.split(".").pop()?.toLowerCase() || "";
  
  return `${userId}/${mediaType.toLowerCase()}/${timestamp}-${random}-${sanitizedFilename}`;
}

