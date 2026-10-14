import { site } from "@/lib/site";

/**
 * Dados estruturados (schema.org) para o Google.
 *
 * Estes componentes são SERVER por um motivo específico: antes eram "use
 * client" com next/script, que injeta o JSON-LD via JavaScript depois do
 * primeiro paint. O Google encontra o conteúdo, mas perder dados
 * estruturados custa muito em rich results — e o Rich Result Test não os via
 * de primeira, a menos que estejam no HTML inicial.
 */

type Crumb = { name: string; url: string };

function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // O conteúdo vem de dados do site, nunca de entrada do usuário.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function StructuredDataWebSite() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: site.name,
        alternateName: `${site.name} — ${site.tagline}`,
        url: site.url,
        inLanguage: "pt-BR",
        description: site.description,
        publisher: {
          "@type": "Organization",
          name: site.name,
          url: site.url,
          logo: {
            "@type": "ImageObject",
            url: `${site.url}/icon-512.png`,
          },
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${site.url}/blog?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

export function StructuredDataOrganization() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "NewsMediaOrganization",
        name: site.name,
        url: site.url,
        logo: {
          "@type": "ImageObject",
          url: `${site.url}/icon-512.png`,
          width: 512,
          height: 512,
        },
        sameAs: [
          site.links.youtube,
          site.links.instagram,
          site.links.tiktok,
          site.links.facebook,
          site.links.pinterest,
          site.links.spotify,
        ],
      }}
    />
  );
}

export function StructuredDataBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}