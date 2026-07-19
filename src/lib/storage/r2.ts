import "server-only";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

export function isR2Configured() {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET);
}

function client() {
  if (!isR2Configured()) throw new Error("R2_NOT_CONFIGURED");
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
  });
}

export async function uploadPrivateObject(key: string, body: Uint8Array | string, contentType: string) {
  await client().send(new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, Body: body, ContentType: contentType, CacheControl: "private, no-store" }));
  return key;
}

export async function privateObjectUrl(key: string, expiresIn = 300) {
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }), { expiresIn: Math.min(900, Math.max(30, expiresIn)) });
}

export async function deletePrivateObject(key: string) {
  await client().send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
}
