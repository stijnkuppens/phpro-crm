import { getAccountRevenue } from '@/features/revenue/queries/get-account-revenue';
import { OmzetTab } from '@/features/revenue/components/omzet-tab';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OmzetPage({ params }: Props) {
  const { id } = await params;
  const revenue = await getAccountRevenue(id);
  return <OmzetTab accountId={id} initialData={revenue} />;
}
