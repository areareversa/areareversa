import { createNavigation } from "next-intl/navigation";

export const locales = ["pt-BR", "en-US", "es-ES"] as const;
export const defaultLocale = "pt-BR" as const;

export type Locale = (typeof locales)[number];

export const pathnames = {
  "/": "/",
  "/blog": "/blog",
  "/blog/[slug]": "/blog/[slug]",
  "/tag/[tag]": "/tag/[tag]",
  "/podcast": "/podcast",
  "/sobre": "/sobre",
  "/salvos": "/salvos",
  "/rss.xml": "/rss.xml",
  "/llms.txt": "/llms.txt",
  "/llms-full.txt": "/llms-full.txt",
  "/admin": "/admin",
  "/admin/login": "/admin/login",
  "/admin/new": "/admin/new",
  "/admin/edit/[id]": "/admin/edit/[id]",
  "/admin/analytics": "/admin/analytics",
  "/admin/ai": "/admin/ai",
  "/admin/configuracoes": "/admin/configuracoes",
  "/admin/comentarios": "/admin/comentarios",
  "/admin/mencoes": "/admin/mencoes",
} as const;

export const routing = {
  locales,
  defaultLocale,
  pathnames,
  localePrefix: "as-needed" as const,
};

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);