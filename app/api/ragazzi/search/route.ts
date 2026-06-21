import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const clienteId = req.nextUrl.searchParams.get("clienteId")?.trim() ?? "";
  if (q.length < 2 || !clienteId) return Response.json([]);

  const ragazzi = await prisma.ragazzo.findMany({
    where: { clienteId, nome: { contains: q } },
    orderBy: { nome: "asc" },
    take: 8,
  });

  return Response.json(ragazzi);
}
