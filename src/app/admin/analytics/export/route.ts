import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthed } from "@/lib/auth";

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const dias = Number(searchParams.get("dias") ?? 30);
  const since = new Date(Date.now() - ([7, 30, 90].includes(dias) ? dias : 30) * 86400000);
  const events = await prisma.event.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" } });

  const header = "createdAt,type,path,target,device,country,city\n";
  const rows = events
    .map((e) => [e.createdAt.toISOString(), e.type, e.path, e.target ?? "", e.device, e.country ?? "", e.city ?? ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(header + rows, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="eventos.csv"' },
  });
}
