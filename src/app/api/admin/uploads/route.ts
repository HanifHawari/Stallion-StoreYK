import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { errorResponse, jsonError } from "@/lib/http";
import { MAX_UPLOAD_BYTES, saveUpload } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    if (Number(request.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 64 * 1024) return jsonError("Ukuran foto maksimal 5 MB.", 413);
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return jsonError("Pilih file foto.", 400);
    return NextResponse.json({ url: await saveUpload(file) }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Foto belum dapat diunggah.");
  }
}
