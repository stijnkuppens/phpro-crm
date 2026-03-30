import { Activity, Building2, Contact, FileText, Handshake, type LucideIcon, MessageSquare, Users } from 'lucide-react';

export type TabMeta = {
  key: string;
  label: string;
  icon: LucideIcon;
  countKey?: 'consultantCount' | 'contactCount' | 'dealCount' | 'activityCount';
};

export const tabMeta: TabMeta[] = [
  { key: 'overview', label: 'Overview', icon: Building2 },
  { key: 'communicatie', label: 'Communicatie', icon: MessageSquare },
  { key: 'contracten', label: 'Contracten', icon: FileText },
  { key: 'consultants', label: 'Consultants', icon: Users, countKey: 'consultantCount' },
  { key: 'contacts', label: 'Contacts', icon: Contact, countKey: 'contactCount' },
  { key: 'deals', label: 'Deals', icon: Handshake, countKey: 'dealCount' },
  { key: 'activiteiten', label: 'Activiteiten', icon: Activity, countKey: 'activityCount' },
];
