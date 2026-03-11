import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;

  // Placeholder — replace with CMS or database content lookup
  notFound();
}
