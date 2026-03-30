import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

const supported = ['nl', 'en'] as const;

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get('locale')?.value;
  const locale = supported.includes(raw as (typeof supported)[number]) ? raw! : 'nl';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
