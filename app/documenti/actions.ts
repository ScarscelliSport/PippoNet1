"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { TipoDocumento } from "@/app/generated/prisma/client";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export async function uploadDocumento(
  clienteId: string,
  ordineId: string | null,
  formData: FormData
) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Seleziona un file da caricare");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Il file supera la dimensione massima di 25MB");
  }

  const tipoRaw = String(formData.get("tipo") ?? "ALTRO");
  const tipo = (Object.values(TipoDocumento) as string[]).includes(tipoRaw)
    ? (tipoRaw as TipoDocumento)
    : TipoDocumento.ALTRO;
  const nome = String(formData.get("nome") ?? "").trim() || file.name;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name);
  const storedName = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, storedName), buffer);

  await prisma.documento.create({
    data: {
      clienteId,
      ordineId,
      tipo,
      nome,
      filePath: storedName,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    },
  });

  revalidatePath(`/clienti/${clienteId}`);
  if (ordineId) revalidatePath(`/ordini/${ordineId}`);
}

export async function deleteDocumento(
  id: string,
  clienteId: string,
  ordineId: string | null,
  _formData: FormData
) {
  const documento = await prisma.documento.findUnique({ where: { id } });
  if (documento) {
    await fs.rm(path.join(UPLOAD_DIR, documento.filePath), { force: true });
    await prisma.documento.delete({ where: { id } });
  }
  revalidatePath(`/clienti/${clienteId}`);
  if (ordineId) revalidatePath(`/ordini/${ordineId}`);
}
