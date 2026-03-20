import { PageHeader } from '@/components/admin/page-header';
import { getAllEquipment } from '@/features/equipment/queries/get-all-equipment';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default async function MaterialsPage() {
  const equipment = await getAllEquipment();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materiaal"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Materiaal' },
        ]}
      />
      {equipment.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Geen materiaal.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Naam</th>
                  <th className="text-left p-3">Serienummer</th>
                  <th className="text-left p-3">Medewerker</th>
                  <th className="text-left p-3">Uitgegeven</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((e) => (
                  <tr key={e.id} className="border-b">
                    <td className="p-3"><Badge variant="outline">{e.type}</Badge></td>
                    <td className="p-3">{e.name}</td>
                    <td className="p-3 text-muted-foreground">{e.serial_number ?? ''}</td>
                    <td className="p-3">{e.employee ? `${e.employee.first_name} ${e.employee.last_name}` : ''}</td>
                    <td className="p-3">{new Date(e.date_issued).toLocaleDateString('nl-BE')}</td>
                    <td className="p-3">
                      {e.date_returned ? (
                        <Badge variant="secondary">Teruggegeven</Badge>
                      ) : (
                        <Badge variant="default">In gebruik</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
