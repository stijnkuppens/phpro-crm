'use client';

import {
  Activity,
  Bell,
  Building2,
  ClipboardList,
  Contact,
  Database,
  LayoutDashboard,
  ScrollText,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useBrandTheme } from '@/lib/hooks/use-brand-theme';

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
      ],
    },
    {
      section: t('consultancy'),
      items: [{ label: t('consultants'), href: '/admin/consultants', icon: Users }],
    },
    {
      section: null, // no label, separator group
      items: [
        { label: t('notifications'), href: '/admin/notifications', icon: Bell },
        { label: t('jobs'), href: '/admin/jobs', icon: ClipboardList },
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
        {navSections.map((section) => (
          <SidebarGroup key={section.section ?? 'misc'}>
            {section.section && <SidebarGroupLabel>{section.section}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton isActive={isActive} render={<Link href={item.href} />}>
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
        <p className="text-xs text-muted-foreground">{brand === '25carat' ? '25Carat' : 'PHPro'} CRM</p>
      </SidebarFooter>
    </Sidebar>
  );
}
