'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeOverviewTab } from './employee-overview-tab';
import { EmployeeSalaryTab } from './employee-salary-tab';
import { EmployeeEquipmentTab } from './employee-equipment-tab';
import { EmployeeDocumentsTab } from './employee-documents-tab';
import { EmployeeLeaveTab } from './employee-leave-tab';
import { EmployeeEvaluationsTab } from './employee-evaluations-tab';
import type { EmployeeWithDetails } from '../types';

type Props = { employee: EmployeeWithDetails };

export function EmployeeDetail({ employee }: Props) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="loon">Loon</TabsTrigger>
        <TabsTrigger value="materiaal">Materiaal</TabsTrigger>
        <TabsTrigger value="documenten">Documenten</TabsTrigger>
        <TabsTrigger value="verlof">Verlof</TabsTrigger>
        <TabsTrigger value="evaluaties">Evaluaties</TabsTrigger>
      </TabsList>
      <TabsContent value="overview"><EmployeeOverviewTab employee={employee} /></TabsContent>
      <TabsContent value="loon"><EmployeeSalaryTab history={employee.salary_history} /></TabsContent>
      <TabsContent value="materiaal"><EmployeeEquipmentTab equipment={employee.equipment} /></TabsContent>
      <TabsContent value="documenten"><EmployeeDocumentsTab documents={employee.documents} /></TabsContent>
      <TabsContent value="verlof"><EmployeeLeaveTab balances={employee.leave_balances} /></TabsContent>
      <TabsContent value="evaluaties"><EmployeeEvaluationsTab evaluations={employee.evaluations} /></TabsContent>
    </Tabs>
  );
}
