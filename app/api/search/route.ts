import { NextRequest } from "next/server";
import { searchAll } from "@/lib/search";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = await searchAll(q, 5);
  return Response.json(results);
}
