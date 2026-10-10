import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/webmention";
import { WEBMENTION_TYPES } from "@/lib/webmention";
import {
  approveMention,
  deleteMention,
  rejectMention,
  replyMention,
  sendOutboundAction,
} from "./actions";

export const metadata = { title: "Menções" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "aguardando",
  approved: "publicada",
  rejected: "recusada",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved: "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "border-neutral-400/40 bg-neutral-500/10 text-neutral-500",
};

export default async function MencoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    erro?: string;
    sent?: string;
    failed?: string;
    t?: string;
    filtro?: string;
  }>;
}) {
  if (!(await isAuthed())) redirect("/admin/login");

  const params = await searchParams;
  const filtro = params.filtro ?? "";

  const [mentions, posts, siteUrl] = await Promise.all([
    prisma.webmention
      .findMany({
        where: filtro ? { status: filtro } : {},
        orderBy: { createdAt: "desc" },
        take: 100,
      })
      .catch(() => []),
    prisma.post
      .findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        select: { slug: true, title: true },
        take: 30,
      })
      .catch(() => []),
    getSiteUrl().catch(() => "https://areareversa.com.br"),
  ]);

  const contagens = await prisma.webmention
    .groupBy({ by: ["status"], _count: { _all: true } })
    .catch(() => []);

  const count = (status: string) =>
    contagens.find((c) => c.status === status)?._count._all ?? 0;

  const btn =
    "rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-xs transition hover:border-[#9333ea] dark:border-[#2a2a30]";
  const btnPrimary =
    "rounded-lg bg-[#9333ea] px-3 py-1.5 text-xs text-white transition hover:bg-[#7e22ce]";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">menções da web</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Seu endpoint: <code className="font-mono text-xs">{siteUrl}/api/webmention</code>
        </p>
      </div>

      {params.ok === "enviados" && (
        <p className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          ✓ {params.sent} menções enviadas para {params.t} sites ({params.failed} sem endpoint
          ou com falha).
        </p>
      )}
      {params.erro === "post" && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          ✗ Post não encontrado.
        </p>
      )}

      <nav aria-label="Filtro" className="flex flex-wrap gap-2 font-mono text-xs">
        {[
          { key: "", label: `todas (${count("pending") + count("approved") + count("rejected")})` },
          { key: "pending", label: `aguardando (${count("pending")})` },
          { key: "approved", label: `publicadas (${count("approved")})` },
          { key: "rejected", label: `recusadas (${count("rejected")})` },
        ].map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/admin/mencoes?filtro=${f.key}` : "/admin/mencoes"}
            aria-current={filtro === f.key ? "page" : undefined}
            className={`rounded-full border px-3 py-1 transition ${
              filtro === f.key
                ? "border-[#9333ea] text-[#9333ea]"
                : "border-[#e5e7eb] text-neutral-500 hover:border-[#9333ea] dark:border-[#2a2a30]"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {mentions.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Nenhuma menção por aqui ainda. Menções chegam quando outro site linka um post e envia
          um POST para <code className="font-mono text-xs">{siteUrl}/api/webmention</code>.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {mentions.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-3 rounded-2xl border border-[#e5e7eb] p-5 dark:border-[#2a2a30]"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${STATUS_CLASS[m.status] ?? STATUS_CLASS.pending}`}
                >
                  {STATUS_LABEL[m.status] ?? m.status}
                </span>
                <span className="rounded-full border border-[#e5e7eb] px-2.5 py-0.5 text-xs text-neutral-500 dark:border-[#2a2a30]">
                  {WEBMENTION_TYPES[m.type as keyof typeof WEBMENTION_TYPES] ?? m.type}
                </span>
                <a
                  href={m.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-neutral-500 underline underline-offset-4 hover:text-[#9333ea]"
                >
                  {m.source}
                </a>
                <span className="ml-auto text-xs text-neutral-400">
                  {new Date(m.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>

              <div className="text-sm">
                {m.authorName ? (
                  <span className="font-semibold">
                    {m.authorUrl ? (
                      <a
                        href={m.authorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4 hover:text-[#9333ea]"
                      >
                        {m.authorName}
                      </a>
                    ) : (
                      m.authorName
                    )}
                  </span>
                ) : null}
                {m.title ? <span className="ml-2 text-neutral-600 dark:text-neutral-300">{m.title}</span> : null}
              </div>

              {m.content ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#4b5563] dark:text-[#d4d4d8]">
                  {m.content}
                </p>
              ) : null}

              {m.postSlug ? (
                <Link
                  href={`/blog/${m.postSlug}`}
                  className="font-mono text-xs text-[#9333ea] underline underline-offset-4"
                >
                  post: {m.postSlug}
                </Link>
              ) : (
                <span className="font-mono text-xs text-neutral-400">
                  alvo não corresponde a um post publicado
                </span>
              )}

              <div className="flex flex-wrap gap-2 border-t border-[#e5e7eb] pt-3 dark:border-[#2a2a30]">
                {m.status !== "approved" && (
                  <form action={approveMention}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className={btnPrimary}>aprovar e publicar</button>
                  </form>
                )}
                {m.status !== "rejected" && (
                  <form action={rejectMention}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className={btn}>recusar</button>
                  </form>
                )}
                <form action={deleteMention}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className={`${btn} text-red-500`}>excluir</button>
                </form>
              </div>

              <form action={replyMention} className="flex gap-2">
                <input type="hidden" name="id" value={m.id} />
                <input
                  name="reply"
                  defaultValue={m.adminReply ?? ""}
                  placeholder="responda a menção (opcional)"
                  className="flex-1 rounded-lg border border-[#e5e7eb] bg-transparent px-3 py-1.5 text-sm dark:border-[#2a2a30]"
                />
                <button className={btn}>salvar resposta</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-2xl border border-[#e5e7eb] p-6 dark:border-[#2a2a30]">
        <h2 className="text-xl font-bold">enviar menções de saída</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Avisa os sites citados no post de que você linkou eles. Só funciona com quem implementa
          webmentions.
        </p>
        {posts.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">Nenhum post publicado.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {posts.map((p) => (
              <li key={p.slug} className="flex flex-wrap items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-sm">{p.title}</span>
                <form action={sendOutboundAction}>
                  <input type="hidden" name="slug" value={p.slug} />
                  <button className={btn}>enviar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}