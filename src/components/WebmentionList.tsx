import { WEBMENTION_TYPES, type WebmentionType } from "@/lib/webmention";

export type Mention = {
  id: string;
  source: string;
  type: string;
  title: string | null;
  authorName: string | null;
  authorUrl: string | null;
  authorPhoto: string | null;
  content: string | null;
  adminReply: string | null;
  createdAt: string;
};

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

const BADGE: Record<string, { label: string; className: string }> = {
  reply: { label: "↩ resposta", className: "border-[#9333ea]/40 text-[#9333ea]" },
  like: { label: "♥ curtida", className: "border-rose-500/40 text-rose-500" },
  repost: { label: "⟳ repost", className: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" },
  mention: { label: "· menção", className: "border-neutral-400/40 text-neutral-500" },
  bookend: { label: "→ link", className: "border-sky-500/40 text-sky-600 dark:text-sky-400" },
};

export function WebmentionList({ mentions }: { mentions: Mention[] }) {
  if (mentions.length === 0) return null;

  return (
    <section
      aria-labelledby="webmentions-title"
      className="flex flex-col gap-4 border-t border-[#e5e7eb] pt-8 dark:border-[#2a2a30]"
    >
      <h2
        id="webmentions-title"
        className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9ca3af]"
      >
        menções da web ({mentions.length})
      </h2>

      <ul className="flex flex-col gap-4">
        {mentions.map((m) => {
          const badge = BADGE[m.type] ?? BADGE.mention;
          const name = m.authorName || hostOf(m.source);

          return (
            <li
              key={m.id}
              className="rounded-2xl border border-[#e5e7eb] p-5 transition hover:border-[#9333ea]/60 dark:border-[#2a2a30]"
            >
              <div className="flex flex-wrap items-center gap-3">
                {m.authorPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.authorPhoto}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9333ea]/10 text-xs font-semibold text-[#9333ea]"
                  >
                    {initials(name)}
                  </span>
                )}

                <span className="min-w-0 text-sm">
                  {m.authorUrl ? (
                    <a
                      href={m.authorUrl}
                      rel="noopener noreferrer nofollow ugc"
                      target="_blank"
                      className="font-semibold underline underline-offset-4 hover:text-[#9333ea]"
                    >
                      {name}
                    </a>
                  ) : (
                    <span className="font-semibold">{name}</span>
                  )}
                  <span className="ml-2 text-xs text-[#9ca3af]">{hostOf(m.source)}</span>
                </span>

                <span
                  className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>

              {m.title ? (
                <a
                  href={m.source}
                  rel="noopener noreferrer nofollow ugc"
                  target="_blank"
                  className="mt-3 block text-sm font-medium underline underline-offset-4 hover:text-[#9333ea]"
                >
                  {m.title}
                </a>
              ) : null}

              {m.content ? (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#4b5563] dark:text-[#d4d4d8]">
                  {m.content}
                </p>
              ) : null}

              {m.adminReply ? (
                <p className="mt-3 border-l-2 border-[#9333ea] pl-3 text-sm italic text-[#6b7280] dark:text-[#a1a1aa]">
                  resposta da área reversa: {m.adminReply}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}