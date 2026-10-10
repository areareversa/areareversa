import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['pt-BR', 'en-US', 'es-ES', 'ar-PS'],
  defaultLocale: 'pt-BR',
  localePrefix: 'always',
  domains: [
    {
      domain: 'www.areareversa.com.br',
      defaultLocale: 'pt-BR',
      locales: ['pt-BR', 'en-US', 'es-ES', 'ar-PS']
    },
    {
      domain: 'areareversa.com.br',
      defaultLocale: 'pt-BR',
      locales: ['pt-BR', 'en-US', 'es-ES', 'ar-PS']
    }
  ],
  pathnames: {
    '/': '/',
    '/blog': '/blog',
    '/blog/[slug]': '/blog/[slug]',
    '/podcast': '/podcast',
    '/salvos': {
      'pt-BR': '/salvos',
      'en-US': '/saved',
      'es-ES': '/guardados',
      'ar-PS': '/المحفوظات'
    },
    '/sobre': {
      'pt-BR': '/sobre',
      'en-US': '/about',
      'es-ES': '/sobre',
      'ar-PS': '/عن-الموقع'
    },
    '/tag/[tag]': '/tag/[tag]',
    '/admin': '/admin',
    '/admin/analytics': '/admin/analytics',
    '/admin/comentarios': {
      'pt-BR': '/admin/comentarios',
      'en-US': '/admin/comments',
      'es-ES': '/admin/comentarios',
      'ar-PS': '/admin/التعليقات'
    },
    '/admin/new': {
      'pt-BR': '/admin/new',
      'en-US': '/admin/new',
      'es-ES': '/admin/nuevo',
      'ar-PS': '/admin/جديد'
    },
    '/admin/edit/[id]': '/admin/edit/[id]',
    '/admin/login': '/admin/login',
    '/admin/ai': '/admin/ai'
  }
});

export type Locale = (typeof routing.locales)[number];
export type Pathnames = typeof routing.pathnames;