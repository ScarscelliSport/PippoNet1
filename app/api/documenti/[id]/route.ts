import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const documento = await prisma.documento.findUnique({ where: { id } });
  if (!documento) return new Response("Not found", { status: 404 });

  const buffer = await fs.readFile(path.join(UPLOAD_DIR, documento.filePath));
  return new Response(buffer, {
    headers: {
      "Content-Type": documento.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(documento.nome)}"`,
    },
  });
}
