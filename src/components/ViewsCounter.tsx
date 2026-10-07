"use client";

import { useEffect, useState } from "react";

export function ViewsCounter({ slug, initial }: { slug: string; initial: number }) {
  const [views, setViews] = useState(initial);

  useEffect(() => {
    fetch(`/api/views/${slug}`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => typeof d.views === "number" && setViews(d.views))
      .catch(() => {});
  }, [slug]);

  return <span>{views} visualizações</span>;
}
