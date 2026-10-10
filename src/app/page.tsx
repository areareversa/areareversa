import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}