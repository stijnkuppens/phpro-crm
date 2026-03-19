import { z } from 'zod';
import type { Database } from '@/types/database';

export type Employee = Database['public']['Tables']['employees']['Row'];
export type EmployeeChild = Database['public']['Tables']['employee_children']['Row'];
export type SalaryHistory = Database['public']['Tables']['salary_history']['Row'];
export type Equipment = Database['public']['Tables']['equipment']['Row'];
export type HrDocument = Database['public']['Tables']['hr_documents']['Row'];
export type LeaveBalance = Database['public']['Tables']['leave_balances']['Row'];
export type Evaluation = Database['public']['Tables']['evaluations']['Row'];

export type EmployeeWithDetails = Employee & {
  children: EmployeeChild[];
  salary_history: SalaryHistory[];
  equipment: Equipment[];
  documents: HrDocument[];
  leave_balances: LeaveBalance[];
  evaluations: Evaluation[];
};

export const employeeFormSchema = z.object({
  first_name: z.string().min(1, 'Voornaam is verplicht'),
  last_name: z.string().min(1, 'Achternaam is verplicht'),
  date_of_birth: z.string().optional().nullable(),
  city: z.string().optional(),
  nationality: z.string().optional(),
  education: z.string().optional(),
  school: z.string().optional(),
  marital_status: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
  hire_date: z.string().min(1, 'Datum indiensttreding is verplicht'),
  termination_date: z.string().optional().nullable(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['actief', 'inactief']),
  gross_salary: z.coerce.number().optional().nullable(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const salaryHistoryFormSchema = z.object({
  date: z.string().min(1, 'Datum is verplicht'),
  gross_salary: z.coerce.number().min(0, 'Brutoloon is verplicht'),
  reason: z.string().optional(),
});
export type SalaryHistoryFormValues = z.infer<typeof salaryHistoryFormSchema>;

export const equipmentFormSchema = z.object({
  type: z.string().min(1, 'Type is verplicht'),
  name: z.string().min(1, 'Naam is verplicht'),
  serial_number: z.string().optional(),
  date_issued: z.string().min(1, 'Uitgiftedatum is verplicht'),
  date_returned: z.string().optional().nullable(),
  notes: z.string().optional(),
});
export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

export const hrDocumentFormSchema = z.object({
  type: z.string().min(1, 'Type is verplicht'),
  name: z.string().min(1, 'Naam is verplicht'),
  url: z.string().optional(),
  date: z.string().min(1, 'Datum is verplicht'),
});
export type HrDocumentFormValues = z.infer<typeof hrDocumentFormSchema>;

export const leaveBalanceFormSchema = z.object({
  year: z.coerce.number(),
  allowance: z.coerce.number().min(0),
  taken: z.coerce.number().min(0),
});
export type LeaveBalanceFormValues = z.infer<typeof leaveBalanceFormSchema>;

export const evaluationFormSchema = z.object({
  date: z.string().min(1, 'Datum is verplicht'),
  type: z.string().min(1, 'Type is verplicht'),
  score: z.string().optional(),
  notes: z.string().optional(),
});
export type EvaluationFormValues = z.infer<typeof evaluationFormSchema>;

export type EmployeeFilters = {
  search?: string;
  status?: string;
  department?: string;
};
