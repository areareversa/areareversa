import { routing } from './routing';

export async function getLocale(): Promise<string> {
  return routing.defaultLocale;
}

export async function getTranslations(locale: string): Promise<Record<string, string>> {
  // This would typically load translations from files
  // For now, return empty object as fallback
  return {};
}