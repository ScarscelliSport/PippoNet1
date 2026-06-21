"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const clienteSchema = z.object({
  nome: z.string().trim().min(1, "Il nome è obbligatorio"),
  referente: z.string().trim().optional(),
  telefono: z.string().trim().optional(),
  email: z.string().trim().optional(),
  indirizzo: z.string().trim().optional(),
  piva: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

function parseCliente(formData: FormData) {
  const raw = {
    nome: String(formData.get("nome") ?? ""),
    referente: String(formData.get("referente") ?? ""),
    telefono: String(formData.get("telefono") ?? ""),
    email: String(formData.get("email") ?? ""),
    indirizzo: String(formData.get("indirizzo") ?? ""),
    piva: String(formData.get("piva") ?? ""),
    note: String(formData.get("note") ?? ""),
  };
  const parsed = clienteSchema.parse(raw);
  return {
    nome: parsed.nome,
    referente: parsed.referente || null,
    telefono: parsed.telefono || null,
    email: parsed.email || null,
    indirizzo: parsed.indirizzo || null,
    piva: parsed.piva || null,
    note: parsed.note || null,
  };
}

export async function createCliente(formData: FormData) {
  const data = parseCliente(formData);

  // Se il form proviene dall'autocompletamento ed è stato selezionato un
  // cliente già esistente, aggiorniamo quel record invece di duplicarlo.
  const existingId = String(formData.get("clienteId") ?? "").trim();
  if (existingId) {
    await prisma.cliente.update({ where: { id: existingId }, data });
    revalidatePath("/clienti");
    revalidatePath(`/clienti/${existingId}`);
    redirect(`/clienti/${existingId}`);
  }

  const cliente = await prisma.cliente.create({ data });
  revalidatePath("/clienti");
  redirect(`/clienti/${cliente.id}`);
}

export async function updateCliente(id: string, formData: FormData) {
  const data = parseCliente(formData);
  await prisma.cliente.update({ where: { id }, data });
  revalidatePath("/clienti");
  revalidatePath(`/clienti/${id}`);
  redirect(`/clienti/${id}`);
}

export async function deleteCliente(id: string) {
  await prisma.cliente.delete({ where: { id } });
  revalidatePath("/clienti");
  redirect("/clienti");
}
