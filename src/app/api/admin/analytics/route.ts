import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getDateRange(period: string) {
  const now = new Date();
  let startDate: Date;
  switch (period) {
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return startDate;
}

function getDeviceType(ua: string): string {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

function getCountryFromIP(ip: string): string {
  // Simplified - in production use a GeoIP service
  // For now, return "Brasil" for Brazilian IPs or "Outros"
  return "Brasil";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "30d";
  const startDate = getDateRange(period);

  try {
    // Total views
    const totalViewsResult = await prisma.event.aggregate({
      where: { type: "pageview", createdAt: { gte: startDate } },
      _count: { id: true },
    });
    const totalViews = totalViewsResult._count.id;

    // Unique visitors (by IP + day)
    const uniqueVisitorsResult = await prisma.event.groupBy({
      by: ["ip", "createdAt"],
      where: { type: "pageview", createdAt: { gte: startDate } },
      _count: { id: true },
    });
    const uniqueVisitors = uniqueVisitorsResult.length;

    // Views by day
    const viewsByDayRaw = await prisma.event.findMany({
      where: { type: "pageview", createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    const viewsByDayMap = new Map<string, number>();
    viewsByDayRaw.forEach((e) => {
      const date = e.createdAt.toISOString().split("T")[0];
      viewsByDayMap.set(date, (viewsByDayMap.get(date) || 0) + 1);
    });

    const viewsByDay = Array.from(viewsByDayMap.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top posts by clicks
    const topPostsRaw = await prisma.event.groupBy({
      by: ["target"],
      where: { type: "click", createdAt: { gte: startDate }, target: { not: null } },
      _count: { id: true },
      orderBy: { _count: { target: "desc" } },
      take: 10,
    });

    const topPostSlugs = topPostsRaw.map((t) => t.target!).filter(Boolean) as string[];
    const topPostsData = await prisma.post.findMany({
      where: { slug: { in: topPostSlugs } },
      select: { slug: true, title: true, views: true },
    });

    const topPosts = topPostSlugs
      .map((slug) => {
        const post = topPostsData.find((p) => p.slug === slug);
        const clickData = topPostsRaw.find((t) => t.target === slug);
        return post ? { slug: post.slug, title: post.title, views: clickData?._count.id ?? 0 } : null;
      })
      .filter(Boolean) as Array<{ slug: string; title: string; views: number }>;

    // Referrers - group by referrer domain
    const referrersRaw = await prisma.event.findMany({
      where: { type: "pageview", createdAt: { gte: startDate } },
      select: { referrer: true },
    });

    const referrerMap = new Map<string, number>();
    referrersRaw.forEach((e) => {
      const ref = e.referrer || "Direto";
      try {
        const domain = new URL(ref).hostname.replace("www.", "");
        referrerMap.set(domain, (referrerMap.get(domain) || 0) + 1);
      } catch {
        referrerMap.set("Direto", (referrerMap.get("Direto") || 0) + 1);
      }
    });

    const referrers = Array.from(referrerMap.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Devices - real data from events
    const deviceRaw = await prisma.event.findMany({
      where: { type: "pageview", createdAt: { gte: startDate } },
      select: { device: true },
    });

    const deviceMap = new Map<string, number>();
    deviceRaw.forEach((e) => {
      const device = e.device || "desktop";
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });

    const devices = Array.from(deviceMap.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    // Countries - real data from events
    const countryRaw = await prisma.event.findMany({
      where: { type: "pageview", createdAt: { gte: startDate } },
      select: { country: true },
    });

    const countryMap = new Map<string, number>();
    countryRaw.forEach((e) => {
      const country = e.country || "Brasil";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });

    const countries = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      totalViews,
      uniqueVisitors,
      viewsByDay,
      topPosts,
      referrers,
      devices,
      countries,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}