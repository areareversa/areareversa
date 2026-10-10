import { prisma } from "./prisma";

/**
 * Configurações do site armazenadas no banco de dados.
 * O painel admin (/admin/configuracoes) escreve aqui; o .env é usado como fallback.
 */

export const SETTING_DEFS = {
  smtp_host: { label: "Servidor SMTP", secret: false, env: "SMTP_HOST" },
  smtp_port: { label: "Porta SMTP", secret: false, env: "SMTP_PORT" },
  smtp_user: { label: "Usuário SMTP", secret: false, env: "SMTP_USER" },
  smtp_pass: { label: "Senha de app", secret: true, env: "SMTP_PASS" },
  email_from: { label: "E-mail remetente", secret: false, env: "EMAIL_FROM" },
  site_url: { label: "URL do site", secret: false, env: "NEXT_PUBLIC_SITE_URL" },
  analytics_ga_id: { label: "Google Analytics ID", secret: false, env: "NEXT_PUBLIC_GA_ID" },
  gemini_api_key: { label: "Chave da API Gemini", secret: true, env: "GEMINI_API_KEY" },
} as const;

export type SettingKey = keyof typeof SETTING_DEFS;

export const SECRET_SETTING_KEYS = (Object.keys(SETTING_DEFS) as SettingKey[]).filter(
  (k) => SETTING_DEFS[k].secret
);

/** Fallbacks do .env para os nomes legados (GMAIL_*, EMAIL_APP_PASSWORD, etc). */
function envFallback(key: SettingKey): string {
  const direct = process.env[SETTING_DEFS[key].env];
  if (direct) return direct;

  switch (key) {
    case "smtp_host":
      return process.env.SMTP_HOST || "smtp.gmail.com";
    case "smtp_port":
      return process.env.SMTP_PORT || "587";
    case "smtp_user":
      return process.env.SMTP_USER || process.env.GMAIL_USER || "";
    case "smtp_pass":
      return (
        process.env.SMTP_PASS ||
        process.env.GMAIL_APP_PASSWORD ||
        process.env.EMAIL_APP_PASSWORD ||
        ""
      );
    case "email_from":
      return process.env.EMAIL_FROM || process.env.SITE_EMAIL || process.env.GMAIL_USER || "";
    case "site_url":
      return process.env.NEXT_PUBLIC_SITE_URL || "https://areareversa.com.br";
    case "analytics_ga_id":
      return process.env.NEXT_PUBLIC_GA_ID || process.env.GA_MEASUREMENT_ID || "";
    case "gemini_api_key":
      return process.env.GEMINI_API_KEY || "";
    default:
      return "";
  }
}

type Row = { key: string; value: string; isSecret: boolean; updatedAt: Date };

let cache: { at: number; rows: Map<string, Row> } | null = null;
const CACHE_TTL = 10_000;

async function loadRows(): Promise<Map<string, Row>> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.rows;
  try {
    const rows = (await prisma.setting.findMany()) as Row[];
    cache = { at: Date.now(), rows: new Map(rows.map((r) => [r.key, r])) };
    return cache.rows;
  } catch {
    // settings pode ainda não existir (migration não aplicada)
    return new Map();
  }
}

export function invalidateSettingsCache() {
  cache = null;
}

/** Valor de uma configuração: banco tem prioridade, .env é fallback. */
export async function getSetting(key: SettingKey): Promise<string> {
  const row = (await loadRows()).get(key);
  if (row && row.value) return row.value;
  return envFallback(key);
}

/** Todos os valores (reais, incluindo segredos) — use apenas no servidor. */
export async function getAllSettings(): Promise<Record<SettingKey, string>> {
  const rows = await loadRows();
  const out = {} as Record<SettingKey, string>;
  for (const key of Object.keys(SETTING_DEFS) as SettingKey[]) {
    out[key] = rows.get(key)?.value || envFallback(key);
  }
  return out;
}

/**
 * Valores para exibição: segredos vêm mascarados.
 * Use `has` para saber se o segredo existe sem expô-lo.
 */
export async function getSettingsForForm(): Promise<
  Record<SettingKey, { value: string; has: boolean; source: "db" | "env" | "none" }>
> {
  const rows = await loadRows();
  const out = {} as Record<
    SettingKey,
    { value: string; has: boolean; source: "db" | "env" | "none" }
  >;
  for (const key of Object.keys(SETTING_DEFS) as SettingKey[]) {
    const row = rows.get(key);
    if (row && row.value) {
      out[key] = {
        value: SETTING_DEFS[key].secret ? "" : row.value,
        has: true,
        source: "db",
      };
    } else {
      const env = envFallback(key);
      out[key] = { value: SETTING_DEFS[key].secret ? "" : env, has: !!env, source: env ? "env" : "none" };
    }
  }
  return out;
}

/** Salva apenas os campos enviados (string vazia em segredo = mantém o existente). */
export async function saveSettings(values: Partial<Record<SettingKey, string>>) {
  const ops = Object.entries(values)
    .filter(([, v]) => typeof v === "string")
    .map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: value as string, isSecret: SETTING_DEFS[key as SettingKey].secret },
        update: { value: value as string, isSecret: SETTING_DEFS[key as SettingKey].secret },
      })
    );
  if (ops.length) await prisma.$transaction(ops);
  invalidateSettingsCache();
}

export async function deleteSetting(key: SettingKey) {
  await prisma.setting.deleteMany({ where: { key } });
  invalidateSettingsCache();
}

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  siteUrl: string;
};

/** Configuração SMTP resolvida (banco > .env). `configured` = tem usuário e senha. */
export async function getSmtpConfig(): Promise<SmtpConfig & { configured: boolean }> {
  const [host, port, user, pass, from, siteUrl] = await Promise.all([
    getSetting("smtp_host"),
    getSetting("smtp_port"),
    getSetting("smtp_user"),
    getSetting("smtp_pass"),
    getSetting("email_from"),
    getSetting("site_url"),
  ]);
  return {
    host: host || "smtp.gmail.com",
    port: Number(port) || 587,
    user,
    pass,
    from: from || user,
    siteUrl: siteUrl || "https://areareversa.com.br",
    configured: !!(user && pass),
  };
}