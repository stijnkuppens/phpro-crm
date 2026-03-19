'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EmployeeWithDetails } from '../types';

type Props = { employee: EmployeeWithDetails };

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function EmployeeOverviewTab({ employee }: Props) {
  const fmt = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('nl-BE') : null;

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Persoonlijke gegevens</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <InfoRow label="Geboortedatum" value={fmt(employee.date_of_birth)} />
          <InfoRow label="Woonplaats" value={employee.city} />
          <InfoRow label="Nationaliteit" value={employee.nationality} />
          <InfoRow label="Burgerlijke staat" value={employee.marital_status} />
          <InfoRow label="Opleiding" value={employee.education} />
          <InfoRow label="School" value={employee.school} />
          {employee.children && employee.children.length > 0 && (
            <div className="py-1 text-sm">
              <span className="text-muted-foreground">Kinderen</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {employee.children.map((child) => (
                  <Badge key={child.id} variant="secondary">
                    {child.first_name} {child.last_name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Werkgegevens</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <InfoRow label="Functie" value={employee.job_title} />
          <InfoRow label="Afdeling" value={employee.department} />
          <InfoRow label="Status" value={employee.status} />
          <InfoRow label="E-mail" value={employee.email} />
          <InfoRow label="Telefoon" value={employee.phone} />
          <InfoRow label="In dienst" value={fmt(employee.hire_date)} />
          <InfoRow label="Uit dienst" value={fmt(employee.termination_date)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Noodcontact</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <InfoRow label="Naam" value={employee.emergency_contact_name} />
          <InfoRow label="Telefoon" value={employee.emergency_contact_phone} />
          <InfoRow label="Relatie" value={employee.emergency_contact_relation} />
        </CardContent>
      </Card>

      {employee.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{employee.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
