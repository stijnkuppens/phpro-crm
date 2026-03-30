import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function DynamicPage({ params }: Props) {
  // Consume params to avoid "unused variable" — replace with CMS or database content lookup
  await params;
  notFound();
}
