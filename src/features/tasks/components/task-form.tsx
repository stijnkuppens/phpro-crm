'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save } from 'lucide-react';
import { taskFormSchema, type TaskFormValues } from '../types';
import { createTask } from '../actions/create-task';
import { updateTask } from '../actions/update-task';

type Props = {
  defaultValues?: Partial<TaskFormValues> & { id?: string };
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
};

export function TaskForm({ defaultValues, onSuccess, onCancel }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!defaultValues?.id;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const values: TaskFormValues = {
      title: formData.get('title') as string,
      due_date: (formData.get('due_date') as string) || undefined,
      priority: formData.get('priority') as TaskFormValues['priority'],
      status: formData.get('status') as TaskFormValues['status'],
      account_id: (formData.get('account_id') as string) || undefined,
      deal_id: (formData.get('deal_id') as string) || undefined,
      assigned_to: (formData.get('assigned_to') as string) || undefined,
    };

    const parsed = taskFormSchema.safeParse(values);
    if (!parsed.success) {
      toast.error('Controleer de verplichte velden');
      setLoading(false);
      return;
    }

    const result = isEdit
      ? await updateTask(defaultValues!.id!, parsed.data)
      : await createTask(parsed.data);

    setLoading(false);

    if ('error' in result && result.error) {
      toast.error(typeof result.error === 'string' ? result.error : 'Er ging iets mis');
      return;
    }

    toast.success(isEdit ? 'Taak bijgewerkt' : 'Taak aangemaakt');
    const id = 'data' in result && result.data ? result.data.id : defaultValues?.id ?? '';
    if (onSuccess) {
      onSuccess(id);
    } else {
      router.push('/admin/tasks');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="title">Titel *</Label>
          <Input id="title" name="title" defaultValue={defaultValues?.title ?? ''} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Prioriteit *</Label>
          <Select name="priority" defaultValue={defaultValues?.priority ?? 'Medium'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="High">Hoog</SelectItem>
              <SelectItem value="Medium">Gemiddeld</SelectItem>
              <SelectItem value="Low">Laag</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select name="status" defaultValue={defaultValues?.status ?? 'Open'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In uitvoering</SelectItem>
              <SelectItem value="Done">Afgerond</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="due_date">Vervaldatum</Label>
          <Input id="due_date" name="due_date" type="date" defaultValue={defaultValues?.due_date ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assigned_to">Toegewezen aan (ID)</Label>
          <Input id="assigned_to" name="assigned_to" defaultValue={defaultValues?.assigned_to ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account_id">Account ID</Label>
          <Input id="account_id" name="account_id" defaultValue={defaultValues?.account_id ?? ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deal_id">Deal ID</Label>
          <Input id="deal_id" name="deal_id" defaultValue={defaultValues?.deal_id ?? ''} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          <Save />
          {loading ? 'Opslaan...' : isEdit ? 'Bijwerken' : 'Aanmaken'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuleren
          </Button>
        )}
      </div>
    </form>
  );
}
