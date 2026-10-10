"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { saveSettings, SETTING_DEFS, type SettingKey } from "@/lib/settings";
import { sendTestEmail } from "@/lib/email";

const KEYS = Object.keys(SETTING_DEFS) as SettingKey[];

export async function saveSettingsAction(formData: FormData) {
  if (!(await isAuthed())) redirect("/admin/login");

  const values: Partial<Record<SettingKey, string>> = {};

  for (const key of KEYS) {
    const raw = formData.get(key);
    if (raw === null) continue; // campo não enviado = não mexer
    const value = String(raw).trim();
    const def = SETTING_DEFS[key];

    if (def.secret) {
      // campo vazio em um segredo = manter o valor já salvo
      if (!value) continue;
      if (value === "••••••••") continue;
    }

    if (!def.secret && !value) {
      values[key] = "";
      continue;
    }

    if (key === "smtp_port") {
      const port = Number(value);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        redirect("/admin/configuracoes?erro=porta");
      }
      values[key] = String(port);
      continue;
    }

    if (key === "site_url" && value && !/^https?:\/\/.+\..+/.test(value)) {
      redirect("/admin/configuracoes?erro=url");
    }

    values[key] = value;
  }

  await saveSettings(values);
  revalidatePath("/admin/configuracoes");
  redirect("/admin/configuracoes?ok=salvo");
}

export async function testEmailAction(formData: FormData) {
  if (!(await isAuthed())) redirect("/admin/login");

  // salva antes para testar com os valores recém-digitados
  const values: Partial<Record<SettingKey, string>> = {};
  for (const key of KEYS) {
    const raw = formData.get(key);
    if (raw === null) continue;
    const value = String(raw).trim();
    const def = SETTING_DEFS[key];
    if (def.secret && (!value || value === "••••••••")) continue;
    values[key] = value;
  }
  await saveSettings(values);

  const to = String(formData.get("test_email") ?? "").trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    redirect("/admin/configuracoes?erro=test_email");
  }

  const result = await sendTestEmail(to);

  if (result.success) {
    redirect("/admin/configuracoes?ok=teste");
  }
  const msg = encodeURIComponent(String(result.reason ?? "erro desconhecido").slice(0, 200));
  redirect(`/admin/configuracoes?erro=falha&msg=${msg}`);
}