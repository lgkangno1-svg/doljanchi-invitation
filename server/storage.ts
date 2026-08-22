// Supports Manus Forge storage by default and S3/R2-compatible object storage after external migration.

import { ENV } from "./_core/env";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type ExternalStorageConfig = { bucket: string; publicBaseUrl: string; endpoint?: string; region: string; accessKeyId: string; secretAccessKey: string };
let externalClient: S3Client | null = null;

function getExternalStorageConfig(): ExternalStorageConfig | null {
  const bucket = process.env.EXTERNAL_S3_BUCKET;
  const publicBaseUrl = process.env.EXTERNAL_S3_PUBLIC_BASE_URL;
  const accessKeyId = process.env.EXTERNAL_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.EXTERNAL_S3_SECRET_ACCESS_KEY;
  if (!bucket || !publicBaseUrl || !accessKeyId || !secretAccessKey) return null;
  return { bucket, publicBaseUrl: publicBaseUrl.replace(/\/+$/, ""), endpoint: process.env.EXTERNAL_S3_ENDPOINT, region: process.env.EXTERNAL_S3_REGION || "auto", accessKeyId, secretAccessKey };
}

export function externalMediaUrl(publicBaseUrl: string, key: string) {
  return `${publicBaseUrl.replace(/\/+$/, "")}/${normalizeKey(key)}`;
}

function getExternalClient(config: ExternalStorageConfig) {
  if (!externalClient) externalClient = new S3Client({ region: config.region, endpoint: config.endpoint, forcePathStyle: process.env.EXTERNAL_S3_FORCE_PATH_STYLE === "true", credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } });
  return externalClient;
}

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY",
    );
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const external = getExternalStorageConfig();
  if (external) {
    const key = appendHashSuffix(normalizeKey(relKey));
    await getExternalClient(external).send(new PutObjectCommand({ Bucket: external.bucket, Key: key, Body: data, ContentType: contentType }));
    return { key, url: externalMediaUrl(external.publicBaseUrl, key) };
  }
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));

  // 1. Get presigned PUT URL from Forge
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);

  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }

  const { url: s3Url } = (await presignResp.json()) as { url: string };
  if (!s3Url) throw new Error("Forge returned empty presign URL");

  // 2. PUT file directly to S3
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });

  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const external = getExternalStorageConfig();
  if (external) return { key, url: externalMediaUrl(external.publicBaseUrl, key) };
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const external = getExternalStorageConfig();
  if (external) return externalMediaUrl(external.publicBaseUrl, relKey);
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = normalizeKey(relKey);

  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);

  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }

  const { url } = (await resp.json()) as { url: string };
  return url;
}
