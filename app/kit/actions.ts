"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Brand, KitStato, StatoConsegna } from "@/app/generated/prisma/client";

const kitSchema = z.object({
  clienteId: z.string().min(1, "Seleziona un cliente"),
  nome: z.string().trim().min(1, "Il nome è obbligatorio"),
  brand: z.nativeEnum(Brand),
  note: z.string().trim().optional(),
});

function parseKit(formData: FormData) {
  const raw = {
    clienteId: String(formData.get("clienteId") ?? ""),
    nome: String(formData.get("nome") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    note: String(formData.get("note") ?? ""),
  };
  const parsed = kitSchema.parse(raw);
  return {
    clienteId: parsed.clienteId,
    nome: parsed.nome,
    brand: parsed.brand,
    note: parsed.note || null,
  };
}

export async function createKit(formData: FormData) {
  const data = parseKit(formData);
  const kit = await prisma.kit.create({ data });
  revalidatePath("/kit");
  revalidatePath(`/clienti/${data.clienteId}`);
  redirect(`/kit/${kit.id}`);
}

export async function updateKit(id: string, formData: FormData) {
  const data = parseKit(formData);
  await prisma.kit.update({ where: { id }, data });
  revalidatePath("/kit");
  revalidatePath(`/kit/${id}`);
  revalidatePath(`/clienti/${data.clienteId}`);
  redirect(`/kit/${id}`);
}

export async function deleteKit(id: string) {
  const kit = await prisma.kit.delete({ where: { id } });
  revalidatePath("/kit");
  revalidatePath(`/clienti/${kit.clienteId}`);
  redirect("/kit");
}

// Stati del kit successivi a "Ordinato" che riflettono il proprio avanzamento
// sull'ordine collegato, per mantenere coerente la consegna nel resto del gestionale.
const STATO_ORDINE_SYNC: Partial<Record<KitStato, StatoConsegna>> = {
  ORDINATO: "ORDINATO",
  IN_LAVORAZIONE: "IN_LAVORAZIONE",
  DA_CONTATTARE: "IN_CONSEGNA",
  CONTATTATO: "IN_CONSEGNA",
  CHIUSO: "CONSEGNATO",
};

export async function updateStatoKit(id: string, formData: FormData) {
  const stato = z.nativeEnum(KitStato).parse(formData.get("stato"));
  const kit = await prisma.kit.findUnique({
    where: { id },
    include: { prodotti: true, atleti: { include: { taglie: true } } },
  });
  if (!kit) return;

  // Ogni ragazzo del kit paga il proprio ordine: quando il kit passa a
  // "Ordinato" creiamo un Ordine per ciascun ragazzo che non ne ha ancora
  // uno, collegato sia alla sua anagrafica (ragazzoId) che alla società
  // sportiva (clienteId del kit).
  const ordineIds = kit.atleti.map((a) => a.ordineId).filter((v): v is string => Boolean(v));

  if (stato === "ORDINATO") {
    const prezziProdotti = new Map(kit.prodotti.map((p) => [p.id, p.prezzoUnitario]));
    for (const atleta of kit.atleti) {
      if (atleta.ordineId) continue;
      const importoTotale = atleta.taglie.reduce(
        (s, t) => s + (prezziProdotti.get(t.kitProdottoId) ?? 0),
        0
      );
      const ordine = await prisma.ordine.create({
        data: {
          clienteId: kit.clienteId,
          ragazzoId: atleta.ragazzoId,
          brand: kit.brand,
          tipo: "ORDINE",
          descrizione: `Kit: ${kit.nome}`,
          importoTotale,
          statoConsegna: "ORDINATO",
        },
      });
      await prisma.kitAtleta.update({ where: { id: atleta.id }, data: { ordineId: ordine.id } });
      ordineIds.push(ordine.id);
    }
  }

  const statoConsegnaSync = STATO_ORDINE_SYNC[stato];
  if (statoConsegnaSync && ordineIds.length > 0) {
    await prisma.ordine.updateMany({
      where: { id: { in: ordineIds } },
      data: { statoConsegna: statoConsegnaSync },
    });
  }

  await prisma.kit.update({
    where: { id },
    data: { stato },
  });

  revalidatePath("/kit");
  revalidatePath(`/kit/${id}`);
  revalidatePath("/ordini");
  revalidatePath(`/clienti/${kit.clienteId}`);
  revalidatePath("/");
}

const prodottoSchema = z.object({
  nome: z.string().trim().min(1, "Il nome è obbligatorio"),
  prezzoUnitario: z.coerce.number().min(0),
  note: z.string().trim().optional(),
});

export async function createKitProdotto(kitId: string, formData: FormData) {
  const parsed = prodottoSchema.parse({
    nome: String(formData.get("nome") ?? ""),
    prezzoUnitario: String(formData.get("prezzoUnitario") ?? "0"),
    note: String(formData.get("note") ?? ""),
  });
  await prisma.kitProdotto.create({
    data: {
      kitId,
      nome: parsed.nome,
      prezzoUnitario: parsed.prezzoUnitario,
      note: parsed.note || null,
    },
  });
  revalidatePath(`/kit/${kitId}`);
}

export async function deleteKitProdotto(id: string, kitId: string) {
  await prisma.kitProdotto.delete({ where: { id } });
  revalidatePath(`/kit/${kitId}`);
}

const atletaSchema = z.object({
  ragazzoId: z.string().trim().optional(),
  nome: z.string().trim().min(1, "Il nome è obbligatorio"),
  email: z.string().trim().optional(),
  cellulare: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

// Il ragazzo è un'anagrafica autonoma legata alla società sportiva del kit,
// così può essere ritrovato e riusato in altri kit/stagioni: se non viene
// selezionato un ragazzo già esistente (autocomplete), ne creiamo uno nuovo
// agganciato al cliente del kit.
export async function createKitAtleta(kitId: string, formData: FormData) {
  const kit = await prisma.kit.findUnique({ where: { id: kitId } });
  if (!kit) return;

  const parsed = atletaSchema.parse({
    ragazzoId: String(formData.get("ragazzoId") ?? ""),
    nome: String(formData.get("nome") ?? ""),
    email: String(formData.get("email") ?? ""),
    cellulare: String(formData.get("cellulare") ?? ""),
    note: String(formData.get("note") ?? ""),
  });

  const datiRagazzo = {
    nome: parsed.nome,
    email: parsed.email || null,
    cellulare: parsed.cellulare || null,
    note: parsed.note || null,
  };

  const ragazzo = parsed.ragazzoId
    ? await prisma.ragazzo.update({ where: { id: parsed.ragazzoId }, data: datiRagazzo })
    : await prisma.ragazzo.create({ data: { ...datiRagazzo, clienteId: kit.clienteId } });

  await prisma.kitAtleta.create({ data: { kitId, ragazzoId: ragazzo.id } });
  revalidatePath(`/kit/${kitId}`);
  revalidatePath(`/clienti/${kit.clienteId}`);
}

export async function deleteKitAtleta(id: string, kitId: string) {
  const atleta = await prisma.kitAtleta.delete({ where: { id } });
  if (atleta.ordineId) {
    await prisma.ordine.delete({ where: { id: atleta.ordineId } }).catch(() => {});
  }
  revalidatePath(`/kit/${kitId}`);
  revalidatePath("/ordini");
}

export async function saveTaglie(kitId: string, formData: FormData) {
  const voci: { atletaId: string; prodottoId: string; taglia: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("taglia_")) continue;
    const [, atletaId, prodottoId] = key.split("_");
    if (!atletaId || !prodottoId) continue;
    voci.push({ atletaId, prodottoId, taglia: String(value).trim() });
  }

  await Promise.all(
    voci.map(({ atletaId, prodottoId, taglia }) => {
      if (!taglia) {
        return prisma.kitTaglia.deleteMany({
          where: { kitAtletaId: atletaId, kitProdottoId: prodottoId },
        });
      }
      return prisma.kitTaglia.upsert({
        where: {
          kitAtletaId_kitProdottoId: { kitAtletaId: atletaId, kitProdottoId: prodottoId },
        },
        update: { taglia },
        create: { kitAtletaId: atletaId, kitProdottoId: prodottoId, taglia },
      });
    })
  );

  revalidatePath(`/kit/${kitId}`);
}
