import { readUpload } from "@/lib/storage";

export const runtime = "nodejs";

// Menyajikan gambar hasil upload admin (lihat lib/storage.ts).
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const file = await readUpload((await params).path);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(file.body), {
    headers: {
      "Content-Type": file.contentType,
      // Nama file unik (UUID) sehingga aman di-cache lama.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
