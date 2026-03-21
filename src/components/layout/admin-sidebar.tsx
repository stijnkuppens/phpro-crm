'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBrandTheme } from '@/lib/hooks/use-brand-theme';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Building2,
  Users,
  TrendingUp,
  Activity,
  CheckSquare,
  FileText,
  Settings,
  Bell,
  ScrollText,
  Database,
  UserPlus,
  Wrench,
  DollarSign,
  Target,
  Layers,
  Contact,
} from 'lucide-react';

const brandLogos: Record<string, { src: string; alt: string; width: number; height: number }> = {
  phpro: { src: '/logos/phpro.svg', alt: 'PHPro', width: 100, height: 34 },
  '25carat': { src: '/logos/25carat-wordmark.svg', alt: '25Carat', width: 120, height: 39 },
};

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const { brand } = useBrandTheme();

  const navSections = [
    {
      section: t('crm'),
      items: [
        { label: t('dashboard'), href: '/admin', icon: LayoutDashboard },
        { label: t('accounts'), href: '/admin/accounts', icon: Building2 },
        { label: t('contacts'), href: '/admin/contacts', icon: Contact },
        { label: t('deals'), href: '/admin/deals', icon: TrendingUp },
        { label: t('activities'), href: '/admin/activities', icon: Activity },
        { label: t('tasks'), href: '/admin/tasks', icon: CheckSquare },
      ],
    },
    {
      section: t('consultancy'),
      items: [
        { label: t('consultants'), href: '/admin/consultants', icon: Users },
      ],
    },
    {
      section: t('hr'),
      items: [
        { label: t('people'), href: '/admin/people', icon: UserPlus },
        { label: t('materials'), href: '/admin/materials', icon: Wrench },
      ],
    },
    {
      section: t('analyse'),
      items: [
        { label: t('revenue'), href: '/admin/revenue', icon: DollarSign },
        { label: t('prognose'), href: '/admin/prognose', icon: Target },
        { label: t('pipeline'), href: '/admin/pipeline', icon: Layers },
      ],
    },
    {
      section: null, // no label, separator group
      items: [
        { label: t('files'), href: '/admin/files', icon: FileText },
        { label: t('notifications'), href: '/admin/notifications', icon: Bell },
        { label: t('audit'), href: '/admin/audit', icon: ScrollText },
        { label: t('users'), href: '/admin/users', icon: Users },
        { label: t('settings'), href: '/admin/settings', icon: Settings },
        { label: 'Referentiedata', href: '/admin/reference-data', icon: Database },
      ],
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="flex h-14 items-center border-b px-4">
        <Link href="/admin">
          <Image
            src={brandLogos[brand].src}
            alt={brandLogos[brand].alt}
            width={brandLogos[brand].width}
            height={brandLogos[brand].height}
            priority
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navSections.map((section, idx) => (
          <SidebarGroup key={idx}>
            {section.section && (
              <SidebarGroupLabel>{section.section}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        render={<Link href={item.href} />}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          {brand === '25carat' ? '25Carat' : 'PHPro'} CRM
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
