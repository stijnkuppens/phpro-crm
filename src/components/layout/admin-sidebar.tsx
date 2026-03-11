'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Users,
  Contact,
  FileText,
  Settings,
  Shield,
  Radio,
  LayoutGrid,
} from 'lucide-react';

const navSections = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Contacts', href: '/admin/contacts', icon: Contact },
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Files', href: '/admin/files', icon: FileText },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
  {
    section: 'Demo',
    items: [
      { label: 'Role Demo', href: '/admin/demo/roles', icon: Shield },
      { label: 'Realtime', href: '/admin/demo/realtime', icon: Radio },
      { label: 'Components', href: '/admin/demo/components', icon: LayoutGrid },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/admin" className="text-lg font-bold">
          {process.env.NEXT_PUBLIC_APP_NAME ?? 'Admin'}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.section}>
            <SidebarGroupLabel>{section.section}</SidebarGroupLabel>
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
        <p className="text-xs text-muted-foreground">PHPro Vibe Starter</p>
      </SidebarFooter>
    </Sidebar>
  );
}
