import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAuthed } from "@/lib/auth";

export const metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  if (!(await isAuthed())) redirect("/admin/login");

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const events = await prisma.event
    .findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" } })
    .catch(() => []);

  const pageviews = events.filter((e) => e.type === "pageview");
  const clicks = events.filter((e) => e.type === "click");

  // acessos por dia (30 dias)
  const byDay = new Map<string, number>();
  for (const e of pageviews) {
    const d = e.createdAt.toISOString().slice(0, 10);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  const days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    days.push({ date: d, count: byDay.get(d) ?? 0 });
  }
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  function topBy(list: typeof events, key: (e: (typeof events)[number]) => string | null, n = 10) {
    const m = new Map<string, number>();
    for (const e of list) {
      const k = key(e);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  }

  const topPosts = topBy(clicks, (e) => e.target);
  const topPages = topBy(pageviews, (e) => e.path);
  const byDevice = topBy(events, (e) => e.device);
  const deviceTotal = Math.max(1, events.length);
  const recent = events.slice(0, 20);

  const card = "rounded-2xl border border-[#e5e7eb] p-5 dark:border-[#2a2a30]";
  const sectionTitle = "text-sm font-semibold uppercase tracking-[0.22em] text-[#9ca3af]";

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-3xl font-bold tracking-[-0.02em]">analytics</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className={card}><p className="text-3xl font-bold">{pageviews.length}</p><p className="text-xs text-[#9ca3af]">acessos (30d)</p></div>
        <div className={card}><p className="text-3xl font-bold">{clicks.length}</p><p className="text-xs text-[#9ca3af]">cliques em posts (30d)</p></div>
        <div className={card}><p className="text-3xl font-bold">{new Set(pageviews.map((e) => e.path)).size}</p><p className="text-xs text-[#9ca3af]">páginas distintas</p></div>
        <div className={card}><p className="text-3xl font-bold">{byDevice[0]?.[0] ?? "—"}</p><p className="text-xs text-[#9ca3af]">dispositivo mais comum</p></div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className={sectionTitle}>Acessos por dia (30 dias)</h2>
        <div className="flex h-40 items-end gap-1">
          {days.map((d) => (
            <div key={d.date} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-[#9333ea]/70 transition group-hover:bg-[#9333ea]"
                style={{ height: `${(d.count / maxDay) * 160}px` }}
                title={`${d.date}: ${d.count}`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-[#9ca3af]">
          <span>{days[0]?.date}</span>
          <span>{days[days.length - 1]?.date}</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="flex flex-col gap-3">
          <h2 className={sectionTitle}>Posts mais clicados</h2>
          <table className="text-sm">
            <tbody>
              {topPosts.map(([slug, n]) => (
                <tr key={slug} className="border-b border-[#e5e7eb] dark:border-[#2a2a30]">
                  <td className="py-2 pr-4 font-mono text-xs">{slug}</td>
                  <td className="py-2 text-right">{n}</td>
                </tr>
              ))}
              {topPosts.length === 0 && <tr><td className="py-2 text-[#9ca3af]">sem dados ainda</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={sectionTitle}>Páginas mais acessadas</h2>
          <table className="text-sm">
            <tbody>
              {topPages.map(([path, n]) => (
                <tr key={path} className="border-b border-[#e5e7eb] dark:border-[#2a2a30]">
                  <td className="py-2 pr-4 font-mono text-xs">{path}</td>
                  <td className="py-2 text-right">{n}</td>
                </tr>
              ))}
              {topPages.length === 0 && <tr><td className="py-2 text-[#9ca3af]">sem dados ainda</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className={sectionTitle}>Dispositivo</h2>
          {byDevice.map(([device, n]) => (
            <div key={device} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>{device}</span>
                <span className="text-[#9ca3af]">{Math.round((n / deviceTotal) * 100)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#e5e7eb] dark:bg-[#2a2a30]">
                <div className="h-2 rounded-full bg-[#9333ea]" style={{ width: `${(n / deviceTotal) * 100}%` }} />
              </div>
            </div>
          ))}
          {byDevice.length === 0 && <p className="text-sm text-[#9ca3af]">sem dados ainda</p>}
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Últimos acessos</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#9ca3af]">
              <th className="pb-2">quando</th>
              <th className="pb-2">tipo</th>
              <th className="pb-2">página</th>
              <th className="pb-2">alvo</th>
              <th className="pb-2">dispositivo</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((e) => (
              <tr key={e.id} className="border-t border-[#e5e7eb] dark:border-[#2a2a30]">
                <td className="py-2 text-xs text-[#9ca3af]">{e.createdAt.toLocaleString("pt-BR")}</td>
                <td className="py-2">{e.type}</td>
                <td className="py-2 font-mono text-xs">{e.path}</td>
                <td className="py-2 font-mono text-xs">{e.target ?? "—"}</td>
                <td className="py-2">{e.device}</td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-[#9ca3af]">nenhum evento registrado ainda — navegue pelo site para gerar dados.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
