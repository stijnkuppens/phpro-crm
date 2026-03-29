'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { PdfUploadField } from '@/components/admin/pdf-upload-field';
import type { Contract } from '@/features/contracts/types';

type Props = {
  hasService: boolean;
  setHasService: (v: boolean) => void;
  serviceUrl: string;
  setServiceUrl: (v: string) => void;
  serviceDoc: string;
  setServiceDoc: (v: string) => void;
  contract: Contract | null;
  accountId: string;
};

export function ContractServiceCard({
  hasService,
  setHasService,
  serviceUrl,
  setServiceUrl,
  serviceDoc,
  setServiceDoc,
  contract,
  accountId,
}: Props) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dienstencontract (SLA)</h2>
          <Switch checked={hasService} onCheckedChange={setHasService} />
        </div>
        {hasService && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start</Label>
                <DatePicker name="service_start" value={contract?.service_start ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label>Einde</Label>
                <DatePicker name="service_end" value={contract?.service_end ?? ''} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Document uploaden</Label>
              <PdfUploadField value={serviceDoc} onChange={setServiceDoc} folder={`contracts/${accountId}`} />
            </div>
            <div className="space-y-1.5">
              <Label>Link naar document (URL)</Label>
              <Input
                value={serviceUrl}
                onChange={(e) => setServiceUrl(e.target.value)}
                placeholder="https://confluence.phpro.be/..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="service_indefinite" defaultChecked={contract?.service_indefinite ?? false} />
              <Label htmlFor="service_indefinite">Onbepaalde duur</Label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
