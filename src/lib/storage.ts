import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { RequestError } from "@/lib/http";

// Penyimpanan upload gambar admin. Driver "local" menulis ke UPLOAD_DIR (default ./storage/uploads)
// dan disajikan oleh route /uploads/[...path]. Driver cloud ditambahkan saat deploy (Checklist Launch).
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
type Extension = keyof typeof TYPES;

export function uploadRoot(): string {
  return path.resolve(process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), "storage", "uploads"));
}

// Jenis file ditentukan dari isi (magic bytes), bukan dari nama atau Content-Type kiriman.
function detectExtension(bytes: Uint8Array): Extension | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

export async function saveUpload(file: File): Promise<string> {
  const driver = process.env.STORAGE_DRIVER?.trim() || "local";
  if (driver !== "local") throw new RequestError(`STORAGE_DRIVER "${driver}" belum didukung.`, 503);
  if (file.size === 0) throw new RequestError("File kosong.");
  if (file.size > MAX_UPLOAD_BYTES) throw new RequestError("Ukuran foto maksimal 5 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = detectExtension(bytes);
  if (!extension) throw new RequestError("Format foto harus JPG, PNG, atau WEBP.");
  const month = new Date().toISOString().slice(0, 7);
  const name = `${randomUUID()}.${extension}`;
  const directory = path.join(uploadRoot(), month);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), bytes, { flag: "wx" });
  return `/uploads/${month}/${name}`;
}

export async function readUpload(segments: string[]): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (segments.length !== 2 || !/^\d{4}-\d{2}$/.test(segments[0]) || !/^[a-f0-9-]{36}\.(jpg|png|webp)$/.test(segments[1])) return null;
  const root = uploadRoot();
  const filePath = path.resolve(root, segments[0], segments[1]);
  if (!filePath.startsWith(root + path.sep)) return null;
  try {
    const body = new Uint8Array(await readFile(filePath));
    return { body, contentType: TYPES[segments[1].split(".").pop() as Extension] };
  } catch {
    return null;
  }
}
