import "server-only";

import { promisify } from "node:util";
import COS from "cos-nodejs-sdk-v5";
import { env } from "@/lib/env";

export function isCosConfigured() {
  return Boolean(env.COS_SECRET_ID && env.COS_SECRET_KEY && env.COS_BUCKET && env.COS_REGION);
}

let cached: COS | null = null;

function client() {
  if (!isCosConfigured()) throw new Error("COS_NOT_CONFIGURED");
  if (!cached) {
    cached = new COS({
      SecretId: env.COS_SECRET_ID!,
      SecretKey: env.COS_SECRET_KEY!,
    });
  }
  return cached;
}

export async function uploadPrivateObject(key: string, body: Uint8Array | string, contentType: string) {
  await promisify(client().putObject.bind(client()))({
    Bucket: env.COS_BUCKET!,
    Region: env.COS_REGION!,
    Key: key,
    Body: body as Buffer,
    ContentType: contentType,
    CacheControl: "private, no-store",
  });
  return key;
}

export async function privateObjectUrl(key: string, expiresIn = 300) {
  const cos = client();
  const url = await new Promise<string>((resolve, reject) => {
    cos.getObjectUrl(
      {
        Bucket: env.COS_BUCKET!,
        Region: env.COS_REGION!,
        Key: key,
        Sign: true,
        Expires: Math.min(900, Math.max(30, expiresIn)),
      },
      (err, data) => {
        if (err || !data?.Url) return reject(err ?? new Error("COS_URL_EMPTY"));
        resolve(data.Url);
      },
    );
  });
  return url;
}

export async function deletePrivateObject(key: string) {
  await promisify(client().deleteObject.bind(client()))({
    Bucket: env.COS_BUCKET!,
    Region: env.COS_REGION!,
    Key: key,
  });
}
