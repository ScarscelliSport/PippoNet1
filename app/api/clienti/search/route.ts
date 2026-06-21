import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json([]);

  const clienti = await prisma.cliente.findMany({
    where: { nome: { contains: q } },
    orderBy: { nome: "asc" },
    take: 8,
  });

  return Response.json(clienti);
}
