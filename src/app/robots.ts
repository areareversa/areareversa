import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // crawlers de busca e agentes que seguem llms.txt
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/blog-md/"] },
    ],
    sitemap: "https://areareversa.com.br/sitemap.xml",
    host: "https://areareversa.com.br",
  };
}