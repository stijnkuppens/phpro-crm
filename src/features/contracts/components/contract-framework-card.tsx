'use client';

import { PdfUploadField } from '@/components/admin/pdf-upload-field';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Contract } from '@/features/contracts/types';

type Props = {
  hasFramework: boolean;
  frameworkUrl: string;
  frameworkDoc: string;
  onChange: (updates: {
    hasFramework?: boolean;
    frameworkUrl?: string;
    frameworkDoc?: string;
  }) => void;
  contract: Contract | null;
  accountId: string;
};

export function ContractFrameworkCard({
  hasFramework,
  frameworkUrl,
  frameworkDoc,
  onChange,
  contract,
  accountId,
}: Props) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Raamcontract
          </h2>
          <Switch checked={hasFramework} onCheckedChange={(v) => onChange({ hasFramework: v })} />
        </div>
        {hasFramework && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start</Label>
                <DatePicker name="framework_start" value={contract?.framework_start ?? ''} />
              </div>
              <div className="space-y-1.5">
                <Label>Einde</Label>
                <DatePicker name="framework_end" value={contract?.framework_end ?? ''} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Document uploaden</Label>
              <PdfUploadField
                value={frameworkDoc}
                onChange={(v) => onChange({ frameworkDoc: v })}
                folder={`contracts/${accountId}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Link naar document (URL)</Label>
              <Input
                value={frameworkUrl}
                onChange={(e) => onChange({ frameworkUrl: e.target.value })}
                placeholder="https://confluence.phpro.be/..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="framework_indefinite"
                defaultChecked={contract?.framework_indefinite ?? false}
              />
              <Label htmlFor="framework_indefinite">Onbepaalde duur</Label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
