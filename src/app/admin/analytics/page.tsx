"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GAEvents } from "@/lib/gaEvents";

type Period = "7d" | "30d" | "90d";

interface Stats {
  totalViews: number;
  uniqueVisitors: number;
  topPosts: Array<{ slug: string; title: string; views: number }>;
  viewsByDay: Array<{ date: string; views: number }>;
  referrers: Array<{ referrer: string; count: number }>;
  devices: Array<{ device: string; count: number }>;
  countries: Array<{ country: string; count: number }>;
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState<Period>("30d");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error("Failed to fetch analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/export?period=${period}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${period}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      GAEvents.ctaClick("analytics_export", "admin_analytics");
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-[#e5e7eb] rounded dark:bg-[#2a2a30]" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-[#e5e7eb] rounded-xl dark:bg-[#2a2a30]" />)}
        </div>
        <div className="h-96 bg-[#e5e7eb] rounded-xl dark:bg-[#2a2a30]" />
      </div>
    );
  }

  if (!stats) return <p className="text-[#ef4444]">Erro ao carregar analytics.</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-[-0.04em]">analytics</h1>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="rounded-xl border border-[#e5e7eb] px-4 py-2 text-sm font-semibold transition hover:border-[#9333ea] hover:text-[#9333ea] dark:border-[#2a2a30] disabled:opacity-50"
        >
          {exportLoading ? "Exportando..." : "Exportar CSV"}
        </button>
      </div>

      <div className="flex gap-2">
        {(["7d", "30d", "90d"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              period === p
                ? "bg-[#9333ea] text-white"
                : "border border-[#e5e7eb] text-[#4b5563] hover:border-[#9333ea] hover:text-[#9333ea] dark:border-[#2a2a30] dark:text-[#d4d4d8]"
            }`}
          >
            Últimos {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Visualizações" value={stats.totalViews.toLocaleString("pt-BR")} />
        <StatCard label="Visitantes únicos" value={stats.uniqueVisitors.toLocaleString("pt-BR")} />
        <StatCard label="Média/dia" value={Math.round(stats.totalViews / (period === "7d" ? 7 : period === "30d" ? 30 : 90)).toLocaleString("pt-BR")} />
        <StatCard label="Top post" value={stats.topPosts[0]?.views?.toLocaleString("pt-BR") ?? "—"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Visualizações por dia">
          <ViewsChart data={stats.viewsByDay} />
        </Card>
        <Card title="Top 10 posts">
          <TopPostsTable posts={stats.topPosts} />
        </Card>
        <Card title="Referrers (top 10)">
          <ReferrersTable referrers={stats.referrers} />
        </Card>
        <Card title="Dispositivos">
          <DevicesChart devices={stats.devices} />
        </Card>
        <Card title="Países (top 10)" className="lg:col-span-2">
          <CountriesTable countries={stats.countries} />
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 dark:border-[#2a2a30] dark:bg-[#17171c]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#0f0f12] dark:text-white">{value}</p>
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#e5e7eb] bg-white p-6 dark:border-[#2a2a30] dark:bg-[#17171c] ${className}`}>
      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#9ca3af] mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ViewsChart({ data }: { data: Array<{ date: string; views: number }> }) {
  if (data.length === 0) return <p className="text-[#9ca3af] text-center py-8">Sem dados</p>;
  
  const maxViews = Math.max(...data.map(d => d.views), 1);
  
  return (
    <div className="h-64 flex items-end gap-1 px-2">
      {data.slice(-30).map((d, i) => (
        <div key={d.date} className="flex-1 flex flex-col items-center">
          <div
            className="w-full bg-[#9333ea] rounded-t transition-all hover:bg-[#a855f7]"
            style={{ height: `${(d.views / maxViews) * 100}%`, minHeight: d.views > 0 ? "4px" : "0" }}
            title={`${new Date(d.date).toLocaleDateString("pt-BR")}: ${d.views} views`}
          />
          <span className="text-[10px] text-[#9ca3af] mt-1">{i % 5 === 0 ? new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}</span>
        </div>
      ))}
    </div>
  );
}

function TopPostsTable({ posts }: { posts: Array<{ slug: string; title: string; views: number }> }) {
  if (posts.length === 0) return <p className="text-[#9ca3af] text-center py-8">Sem dados</p>;
  
  return (
    <div className="space-y-3">
      {posts.slice(0, 10).map((p, i) => (
        <Link key={p.slug} href={`/blog/${p.slug}`} target="_blank" rel="noopener" className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#9333ea]/5 transition">
          <span className="w-8 text-center text-[#9ca3af] font-mono text-sm">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{p.title}</p>
            <p className="text-xs text-[#9ca3af]">{p.views.toLocaleString("pt-BR")} views</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ReferrersTable({ referrers }: { referrers: Array<{ referrer: string; count: number }> }) {
  if (referrers.length === 0) return <p className="text-[#9ca3af] text-center py-8">Sem dados</p>;
  
  return (
    <div className="space-y-3">
      {referrers.slice(0, 10).map((r) => (
        <div key={r.referrer} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#9333ea]/5 transition">
          <span className="text-sm truncate max-w-[200px]">{r.referrer === "" ? "Direto" : r.referrer}</span>
          <span className="text-[#9ca3af] font-mono">{r.count.toLocaleString("pt-BR")}</span>
        </div>
      ))}
    </div>
  );
}

function DevicesChart({ devices }: { devices: Array<{ device: string; count: number }> }) {
  if (devices.length === 0) return <p className="text-[#9ca3af] text-center py-8">Sem dados</p>;
  
  const total = devices.reduce((sum, d) => sum + d.count, 0);
  
  return (
    <div className="space-y-4">
      {devices.map((d) => (
        <div key={d.device}>
          <div className="flex justify-between text-sm mb-1">
            <span className="capitalize">{d.device}</span>
            <span className="text-[#9ca3af]">{((d.count / total) * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-[#e5e7eb] rounded-full dark:bg-[#2a2a30] overflow-hidden">
            <div
              className="h-full bg-[#9333ea] rounded-full transition-all"
              style={{ width: `${(d.count / total) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CountriesTable({ countries }: { countries: Array<{ country: string; count: number }> }) {
  if (countries.length === 0) return <p className="text-[#9ca3af] text-center py-8">Sem dados</p>;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {countries.slice(0, 20).map((c) => (
        <Link key={c.country} href={`/blog?country=${encodeURIComponent(c.country)}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#9333ea]/5 transition">
          <span className="text-sm">{c.country}</span>
          <span className="text-[#9ca3af] font-mono">{c.count.toLocaleString("pt-BR")}</span>
        </Link>
      ))}
    </div>
  );
}