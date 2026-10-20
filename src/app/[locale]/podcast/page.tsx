import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { fetchEpisodes } from "@/lib/podcast";
import PodcastPageClient from "./PodcastPageClient";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "podcast" });
  const siteT = await getTranslations({ locale, namespace: "site" });

  return {
    title: t("title"),
    description: t("subtitle"),
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      locale: locale.replace("-", "_"),
      type: "website",
    },
  };
}

export default async function PodcastPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const feed = await fetchEpisodes({ revalidate: 600 }).catch(() => null);

  return <PodcastPageClient initialLocale={locale} initialEpisodes={feed?.episodes ?? []} />;
}