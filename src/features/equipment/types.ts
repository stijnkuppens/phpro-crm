import type { Database } from '@/types/database';

export type Equipment = Database['public']['Tables']['equipment']['Row'];

export type EquipmentWithEmployee = Equipment & {
  employee: { id: string; first_name: string; last_name: string } | null;
};
