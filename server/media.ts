export type MediaKind = "image" | "video";

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

const mediaTypes: Record<string, MediaKind> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
  "video/mp4": "video",
  "video/webm": "video",
};

function hasExpectedSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/gif") return buffer.subarray(0, 4).toString() === "GIF8";
  if (mimeType === "image/webp") return buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
  if (mimeType === "video/mp4") return buffer.subarray(4, 8).toString() === "ftyp";
  if (mimeType === "video/webm") return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return false;
}

export function validateMediaUpload(fileName: string, mimeType: string, base64: string) {
  const kind = mediaTypes[mimeType];
  if (!kind) throw new Error("JPG, PNG, WEBP, GIF, MP4, WEBM 파일만 업로드할 수 있어요.");
  if (!fileName || fileName.length > 140) throw new Error("파일명을 확인해 주세요.");
  const data = Buffer.from(base64, "base64");
  if (!data.length) throw new Error("비어 있는 파일은 업로드할 수 없어요.");
  if (data.length > (kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) throw new Error(kind === "video" ? "동영상은 30MB 이하만 업로드할 수 있어요." : "사진과 GIF는 12MB 이하만 업로드할 수 있어요.");
  if (!hasExpectedSignature(data, mimeType)) throw new Error("파일 내용이 선택한 형식과 일치하지 않아요.");
  return { data, kind };
}

export function safeMediaFileName(fileName: string) {
  return fileName.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(-100) || "media";
}
