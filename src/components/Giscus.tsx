"use client";

import { useEffect } from "react";

export function Giscus() {
  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

  useEffect(() => {
    if (!repo || !repoId || !categoryId || document.getElementById("giscus-script")) return;
    const s = document.createElement("script");
    s.id = "giscus-script";
    s.src = "https://giscus.app/client.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    s.setAttribute("data-repo", repo);
    s.setAttribute("data-repo-id", repoId);
    s.setAttribute("data-category", category ?? "General");
    s.setAttribute("data-category-id", categoryId);
    s.setAttribute("data-mapping", "pathname");
    s.setAttribute("data-reactions-enabled", "1");
    s.setAttribute("data-lang", "pt");
    s.setAttribute("data-theme", document.documentElement.classList.contains("dark") ? "dark_dimmed" : "light");
    document.body.appendChild(s);
  }, [repo, repoId, category, categoryId]);

  if (!repo) return null;
  return <div className="giscus mt-4" />;
}
