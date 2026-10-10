import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettingsForForm, getSmtpConfig, SETTING_DEFS, type SettingKey } from "@/lib/settings";
import { saveSettingsAction, testEmailAction } from "./actions";

export const metadata = { title: "Configurações" };
export const dynamic = "force-dynamic";

const ERROS: Record<string, string> = {
  porta: "A porta SMTP precisa ser um número entre 1 e 65535.",
  url: "A URL do site precisa começar com http:// ou https://",
  test_email: "Informe um e-mail válido para o teste.",
  falha: "Falha ao enviar o e-mail de teste.",
};

const HELP: Partial<Record<SettingKey, string>> = {
  smtp_host: "Para Gmail use smtp.gmail.com. Para Outlook/Hotmail use smtp-mail.outlook.com.",
  smtp_port: "587 com TLS (recomendado) ou 465 com SSL.",
  smtp_pass: "Senha de app do Google, não a senha da sua conta.",
  email_from: "Precisa ser o mesmo endereço do usuário SMTP no Gmail.",
  site_url: "Usado nos links dos e-mails e no sitemap. Sem barra no final.",
  analytics_ga_id: "Formato G-XXXXXXXXXX. Deixe vazio para desativar.",
};

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string; msg?: string }>;
}) {
  if (!(await isAuthed())) redirect("/admin/login");

  const { ok, erro, msg } = await searchParams;
  const [values, smtp] = await Promise.all([
    getSettingsForForm(),
    getSmtpConfig(),
  ]);

  const [subs, totalPosts] = await Promise.all([
    prisma.emailSubscriber.findMany({
      select: { email: true, confirmed: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }).catch(() => []),
    prisma.post.count().catch(() => 0),
  ]);

  const confirmados = subs.filter((s) => s.confirmed).length;

  const inputClass =
    "rounded-lg border border-neutral-300 bg-transparent px-4 py-2 font-normal dark:border-[#2a2a30]";

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">configurações</h1>

      {ok === "salvo" && (
        <p className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          ✓ Configurações salvas.
        </p>
      )}
      {ok === "teste" && (
        <p className="rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
          ✓ E-mail de teste enviado. Confira a caixa de entrada (e o spam).
        </p>
      )}
      {erro && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          ✗ {ERROS[erro] ?? "Algo deu errado."}
          {erro === "falha" && msg ? <span className="mt-1 block font-mono text-xs opacity-80">{decodeURIComponent(msg)}</span> : null}
        </p>
      )}

      <section className="rounded-2xl border border-neutral-200 p-6 dark:border-[#2a2a30]">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold">envio de e-mail</h2>
          {smtp.configured ? (
            <span className="rounded-full border border-green-500/40 bg-green-500/10 px-3 py-1 text-xs text-green-600 dark:text-green-400">
              configurado
            </span>
          ) : (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-600 dark:text-amber-400">
              não configurado — newsletter não envia
            </span>
          )}
        </div>

        <form action={saveSettingsAction} className="flex flex-col gap-5">
          {(Object.keys(SETTING_DEFS) as SettingKey[])
            .filter((k) => k !== "analytics_ga_id" && k !== "gemini_api_key")
            .map((key) => {
              const def = SETTING_DEFS[key];
              const v = values[key];
              return (
                <label key={key} className="flex max-w-xl flex-col gap-1 text-sm">
                  <span className="font-mono">{def.label}</span>
                  <input
                    type={def.secret ? "password" : key === "smtp_port" ? "number" : "text"}
                    name={key}
                    defaultValue={v.value}
                    placeholder={
                      def.secret
                        ? v.has
                          ? "•••••••• (salvo — deixe vazio para manter)"
                          : "não configurado"
                        : v.has
                          ? v.value
                          : ""
                    }
                    autoComplete="off"
                    className={inputClass}
                  />
                  {HELP[key] ? (
                    <span className="text-xs text-neutral-500">{HELP[key]}</span>
                  ) : null}
                  {v.source === "env" ? (
                    <span className="text-xs text-neutral-400">
                      Usando o valor do .env. Salve aqui para sobrescrever.
                    </span>
                  ) : null}
                </label>
              );
            })}

          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-lg bg-neutral-900 px-4 py-2 text-white dark:bg-neutral-100 dark:text-neutral-900">
              salvar
            </button>
            <span className="text-xs text-neutral-500">
              Campos de segredo em branco mantêm o valor já salvo.
            </span>
          </div>
        </form>

        <form action={testEmailAction} className="mt-6 flex flex-wrap items-end gap-3 border-t border-neutral-200 pt-6 dark:border-[#2a2a30]">
          <input type="hidden" name="smtp_host" value={values.smtp_host.value} />
          <input type="hidden" name="smtp_port" value={values.smtp_port.value} />
          <input type="hidden" name="smtp_user" value={values.smtp_user.value} />
          <input type="hidden" name="smtp_pass" value={values.smtp_pass.value} />
          <input type="hidden" name="email_from" value={values.email_from.value} />
          <input type="hidden" name="site_url" value={values.site_url.value} />

          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="font-mono">Enviar teste para</span>
            <input
              type="email"
              name="test_email"
              placeholder={smtp.user || "voce@exemplo.com"}
              className={`${inputClass} w-full max-w-xs`}
            />
          </label>
          <button
            className="rounded-lg border border-neutral-300 px-4 py-2 dark:border-[#2a2a30]"
            disabled={!smtp.configured}
          >
            enviar e-mail de teste
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-200 p-6 dark:border-[#2a2a30]">
        <h2 className="mb-5 text-xl font-bold">integrações</h2>
        <form action={saveSettingsAction} className="flex flex-col gap-5">
          {(Object.keys(SETTING_DEFS) as SettingKey[])
            .filter((k) => k === "analytics_ga_id" || k === "gemini_api_key")
            .map((key) => {
              const def = SETTING_DEFS[key];
              const v = values[key];
              return (
                <label key={key} className="flex max-w-xl flex-col gap-1 text-sm">
                  <span className="font-mono">{def.label}</span>
                  <input
                    type={def.secret ? "password" : "text"}
                    name={key}
                    defaultValue={v.value}
                    placeholder={def.secret ? (v.has ? "•••••••• (salvo)" : "não configurado") : v.value}
                    autoComplete="off"
                    className={inputClass}
                  />
                  {HELP[key] ? <span className="text-xs text-neutral-500">{HELP[key]}</span> : null}
                </label>
              );
            })}
          <button className="self-start rounded-lg bg-neutral-900 px-4 py-2 text-white dark:bg-neutral-100 dark:text-neutral-900">
            salvar integrações
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-200 p-6 dark:border-[#2a2a30]">
        <h2 className="text-xl font-bold">newsletter</h2>
        <p className="mt-2 font-mono text-sm text-neutral-500">
          {confirmados} confirmados de {subs.length} listados · {totalPosts} posts no total
        </p>
        {subs.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">Nenhum assinante ainda.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2 font-mono text-sm">
            {subs.map((s) => (
              <li key={s.email} className="flex items-center gap-3">
                <span className={s.confirmed ? "text-green-600 dark:text-green-400" : "text-neutral-500"}>
                  {s.confirmed ? "●" : "○"}
                </span>
                <span className="truncate">{s.email}</span>
                <span className="ml-auto shrink-0 text-xs text-neutral-400">
                  {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}