"use client";

import { useState, useEffect } from "react";
import { PostGrid } from "@/components/PostGrid";
import { BlogGridSkeleton } from "@/components/Skeletons";
import { StructuredDataBreadcrumb } from "@/components/StructuredData";
import { site } from "@/lib/site";
import Link from "next/link";

const PAGE_SIZE = 9;

interface SearchParams {
  categoria?: string;
  q?: string;
  pagina?: string;
}

export function BlogIndexClient({ initialData }: { initialData: { posts: any[]; total: number; grouped: any[]; searchParams: SearchParams } }) {
  const [posts, setPosts] = useState(initialData.posts);
  const [total, setTotal] = useState(initialData.total);
  const [grouped, setGrouped] = useState(initialData.grouped);
  const [searchParams, setSearchParams] = useState(initialData.searchParams);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(() => Math.max(1, parseInt(initialData.searchParams.pagina ?? "1", 10) || 1));

  const fetchData = async (newParams: SearchParams, newPage: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (newParams.categoria) params.set("categoria", newParams.categoria);
      if (newParams.q) params.set("q", newParams.q);
      params.set("pagina", String(newPage));
      
      const res = await fetch(`/api/blog?${params.toString()}`);
      const data = await res.json();
      setPosts(data.posts);
      setTotal(data.total);
      setGrouped(data.grouped);
      setSearchParams(data.searchParams);
      setPage(data.page);
    } catch (e) {
      console.error("Failed to fetch blog data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newParams: SearchParams = {
      q: formData.get("q") as string || undefined,
      categoria: formData.get("categoria") as string || undefined,
    };
    setSearchParams(newParams);
    fetchData(newParams, 1);
  };

  const handlePageChange = (newPage: number) => {
    fetchData(searchParams, newPage);
  };

  const handleCategoryClick = (categoria: string | undefined) => {
    const newParams = { ...searchParams, categoria };
    setSearchParams(newParams);
    fetchData(newParams, 1);
  };

  const handleClearSearch = () => {
    const newParams = { categoria: searchParams.categoria };
    setSearchParams(newParams);
    fetchData(newParams, 1);
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const breadcrumbs = [
    { name: "Início", url: site.url },
    { name: "Blog", url: `${site.url}/blog` },
  ];

  return (
    <div className="flex flex-col gap-8">
      <StructuredDataBreadcrumb items={breadcrumbs} />
      <h1 className="text-5xl font-bold tracking-[-0.04em]">blog</h1>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={searchParams.q}
          placeholder="buscar por título ou resumo..."
          className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-[#f9f7fa] px-4 py-2.5 text-sm outline-none focus:border-[#9333ea] dark:border-[#2a2a30] dark:bg-[#17171c]"
        />
        {searchParams.categoria && <input type="hidden" name="categoria" value={searchParams.categoria} />}
        <button type="submit" className="rounded-xl border border-[#e5e7eb] px-4 py-2 text-sm font-semibold transition hover:border-[#9333ea] hover:text-[#9333ea] dark:border-[#2a2a30]">buscar</button>
      </form>

      <div className="flex flex-wrap gap-2 text-xs">
        <Link 
          href="#" 
          onClick={(e) => { e.preventDefault(); handleClearSearch(); }}
          className={`rounded-full border px-3 py-1.5 ${!searchParams.categoria ? "border-[#9333ea] bg-[#9333ea]/10 text-[#9333ea]" : "border-[#e5e7eb] text-[#4b5563] dark:border-[#2a2a30] dark:text-[#d4d4d8]"}`}
        >
          todas
        </Link>
        {grouped.map((c) => (
          <Link
            key={c.category}
            href="#"
            onClick={(e) => { e.preventDefault(); handleCategoryClick(c.category); }}
            className={`rounded-full border px-3 py-1.5 ${searchParams.categoria === c.category ? "border-[#9333ea] bg-[#9333ea]/10 text-[#9333ea]" : "border-[#e5e7eb] text-[#4b5563] dark:border-[#2a2a30] dark:text-[#d4d4d8]"}`}
          >
            {c.category} ({c._count._all})
          </Link>
        ))}
      </div>

      {loading ? <BlogGridSkeleton count={PAGE_SIZE} /> : <PostGrid posts={posts} q={searchParams.q} />}

      {pages > 1 && (
        <nav aria-label="Paginação" className="flex items-center gap-4 text-sm">
          {page > 1 && (
            <button onClick={() => handlePageChange(page - 1)} className="text-[#9333ea] underline underline-offset-4 hover:text-[#a855f7]">← anterior</button>
          )}
          <span className="text-[#9ca3af]">página {page} de {pages}</span>
          {page < pages && (
            <button onClick={() => handlePageChange(page + 1)} className="text-[#9333ea] underline underline-offset-4 hover:text-[#a855f7]">próxima →</button>
          )}
        </nav>
      )}
    </div>
  );
}