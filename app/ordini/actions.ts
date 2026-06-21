"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  Brand,
  StatoConsegna,
  StatoLavorazione,
  TipoLavorazione,
  TipoOrdine,
} from "@/app/generated/prisma/client";

const ordineSchema = z.object({
  clienteId: z.string().min(1, "Seleziona un cliente"),
  brand: z.nativeEnum(Brand),
  tipo: z.nativeEnum(TipoOrdine),
  numero: z.string().trim().optional(),
  descrizione: z.string().trim().optional(),
  importoTotale: z.coerce.number().min(0, "L'importo non può essere negativo"),
  dataOrdine: z.string().min(1),
  dataConsegnaPrevista: z.string().optional(),
  dataConsegnaEffettiva: z.string().optional(),
  statoConsegna: z.nativeEnum(StatoConsegna),
  note: z.string().trim().optional(),
});

function parseOrdine(formData: FormData) {
  const raw = {
    clienteId: String(formData.get("clienteId") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    tipo: String(formData.get("tipo") ?? ""),
    numero: String(formData.get("numero") ?? ""),
    descrizione: String(formData.get("descrizione") ?? ""),
    importoTotale: String(formData.get("importoTotale") ?? "0"),
    dataOrdine: String(formData.get("dataOrdine") ?? ""),
    dataConsegnaPrevista: String(formData.get("dataConsegnaPrevista") ?? ""),
    dataConsegnaEffettiva: String(formData.get("dataConsegnaEffettiva") ?? ""),
    statoConsegna: String(formData.get("statoConsegna") ?? "DA_ORDINARE"),
    note: String(formData.get("note") ?? ""),
  };
  const parsed = ordineSchema.parse(raw);
  return {
    clienteId: parsed.clienteId,
    brand: parsed.brand,
    tipo: parsed.tipo,
    numero: parsed.numero || null,
    descrizione: parsed.descrizione || null,
    importoTotale: parsed.importoTotale,
    dataOrdine: new Date(parsed.dataOrdine),
    dataConsegnaPrevista: parsed.dataConsegnaPrevista
      ? new Date(parsed.dataConsegnaPrevista)
      : null,
    dataConsegnaEffettiva: parsed.dataConsegnaEffettiva
      ? new Date(parsed.dataConsegnaEffettiva)
      : null,
    statoConsegna: parsed.statoConsegna,
    note: parsed.note || null,
  };
}

export async function createOrdine(formData: FormData) {
  const data = parseOrdine(formData);
  const ordine = await prisma.ordine.create({ data });
  revalidatePath("/ordini");
  revalidatePath(`/clienti/${data.clienteId}`);
  redirect(`/ordini/${ordine.id}`);
}

export async function updateOrdine(id: string, formData: FormData) {
  const data = parseOrdine(formData);
  await prisma.ordine.update({ where: { id }, data });
  revalidatePath("/ordini");
  revalidatePath(`/ordini/${id}`);
  revalidatePath(`/clienti/${data.clienteId}`);
  redirect(`/ordini/${id}`);
}

export async function deleteOrdine(id: string) {
  const ordine = await prisma.ordine.delete({ where: { id } });
  revalidatePath("/ordini");
  revalidatePath(`/clienti/${ordine.clienteId}`);
  redirect(`/clienti/${ordine.clienteId}`);
}

export async function updateStatoConsegnaOrdine(id: string, formData: FormData) {
  const statoConsegna = z.nativeEnum(StatoConsegna).parse(formData.get("statoConsegna"));
  const dataConsegnaEffettivaRaw = String(formData.get("dataConsegnaEffettiva") ?? "");
  const ordine = await prisma.ordine.update({
    where: { id },
    data: {
      statoConsegna,
      dataConsegnaEffettiva:
        statoConsegna === "CONSEGNATO"
          ? dataConsegnaEffettivaRaw
            ? new Date(dataConsegnaEffettivaRaw)
            : new Date()
          : null,
    },
  });
  revalidatePath("/ordini");
  revalidatePath(`/ordini/${id}`);
  revalidatePath(`/clienti/${ordine.clienteId}`);
  revalidatePath("/");
}

const lavorazioneSchema = z.object({
  tipo: z.nativeEnum(TipoLavorazione),
  descrizione: z.string().trim().optional(),
  fornitore: z.string().trim().optional(),
  costo: z.coerce.number().min(0),
  stato: z.nativeEnum(StatoLavorazione),
});

export async function createLavorazione(ordineId: string, formData: FormData) {
  const parsed = lavorazioneSchema.parse({
    tipo: String(formData.get("tipo") ?? ""),
    descrizione: String(formData.get("descrizione") ?? ""),
    fornitore: String(formData.get("fornitore") ?? ""),
    costo: String(formData.get("costo") ?? "0"),
    stato: String(formData.get("stato") ?? "DA_FARE"),
  });
  await prisma.lavorazione.create({
    data: {
      ordineId,
      tipo: parsed.tipo,
      descrizione: parsed.descrizione || null,
      fornitore: parsed.fornitore || null,
      costo: parsed.costo,
      stato: parsed.stato,
    },
  });
  revalidatePath(`/ordini/${ordineId}`);
  revalidatePath("/lavorazioni");
  revalidatePath("/");
}

export async function updateStatoLavorazione(
  id: string,
  ordineId: string,
  formData: FormData
) {
  const stato = z.nativeEnum(StatoLavorazione).parse(formData.get("stato"));
  await prisma.lavorazione.update({ where: { id }, data: { stato } });
  revalidatePath(`/ordini/${ordineId}`);
  revalidatePath("/lavorazioni");
  revalidatePath("/");
}

export async function deleteLavorazione(id: string, ordineId: string) {
  await prisma.lavorazione.delete({ where: { id } });
  revalidatePath(`/ordini/${ordineId}`);
  revalidatePath("/lavorazioni");
  revalidatePath("/");
}

const pagamentoSchema = z.object({
  data: z.string().min(1),
  importo: z.coerce.number().positive("L'importo deve essere maggiore di zero"),
  metodo: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export async function createPagamento(ordineId: string, formData: FormData) {
  const parsed = pagamentoSchema.parse({
    data: String(formData.get("data") ?? ""),
    importo: String(formData.get("importo") ?? "0"),
    metodo: String(formData.get("metodo") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  await prisma.pagamento.create({
    data: {
      ordineId,
      data: new Date(parsed.data),
      importo: parsed.importo,
      metodo: parsed.metodo || null,
      note: parsed.note || null,
    },
  });
  revalidatePath(`/ordini/${ordineId}`);
  revalidatePath("/ordini");
  revalidatePath("/clienti");
  revalidatePath("/");
}

export async function deletePagamento(id: string, ordineId: string) {
  await prisma.pagamento.delete({ where: { id } });
  revalidatePath(`/ordini/${ordineId}`);
  revalidatePath("/ordini");
  revalidatePath("/clienti");
  revalidatePath("/");
}
