'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/admin/page-header';
import { StatCard } from '@/components/admin/stat-card';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { RoleGuard } from '@/components/admin/role-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Loader2, Users, TrendingUp, FileText, HardDrive } from 'lucide-react';

export default function ComponentShowcasePage() {
  const [progress, setProgress] = useState(45);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Component Showcase"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Demo' },
          { label: 'Components' },
        ]}
      />

      <Tabs defaultValue="inputs">
        <TabsList>
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="overlay">Overlay</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="inputs" className="space-y-4 pt-4">
          <Card style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 200px' }}>
            <CardHeader>
              <CardTitle>Button</CardTitle>
              <CardDescription>Available button variants and sizes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="lg">Large</Button>
                <Button size="default">Default</Button>
                <Button size="sm">Small</Button>
                <Button size="icon"><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled>Disabled</Button>
                <Button><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading</Button>
              </div>
            </CardContent>
          </Card>

          <Card style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 200px' }}>
            <CardHeader>
              <CardTitle>Input &amp; Textarea</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <Input placeholder="Text input..." />
              <Input type="email" placeholder="Email input..." />
              <Input disabled placeholder="Disabled input..." />
              <Textarea placeholder="Textarea..." />
            </CardContent>
          </Card>

          <Card style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 150px' }}>
            <CardHeader>
              <CardTitle>Checkbox &amp; Switch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox id="check1" />
                <label htmlFor="check1" className="text-sm">Accept terms</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="switch1" />
                <label htmlFor="switch1" className="text-sm">Enable notifications</label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4 pt-4">
          <Card style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 200px' }}>
            <CardHeader>
              <CardTitle>Toast Notifications</CardTitle>
              <CardDescription>Feedback toasts via sonner</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={() => toast.success('Contact saved successfully')}>Success</Button>
              <Button variant="destructive" onClick={() => toast.error('Failed to delete contact')}>Error</Button>
              <Button variant="outline" onClick={() => toast('New contact added', {
                action: { label: 'Undo', onClick: () => toast('Undone!') },
              })}>With Action</Button>
              <Button variant="secondary" onClick={() => toast.promise(
                new Promise((resolve) => setTimeout(resolve, 2000)),
                { loading: 'Saving...', success: 'Saved!', error: 'Failed' },
              )}>Promise</Button>
            </CardContent>
          </Card>

          <Card style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 150px' }}>
            <CardHeader>
              <CardTitle>Badge</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </CardContent>
          </Card>

          <Card style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 150px' }}>
            <CardHeader>
              <CardTitle>Skeleton &amp; Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={progress} />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setProgress((p) => Math.max(0, p - 10))}>-10</Button>
                  <Button size="sm" variant="outline" onClick={() => setProgress((p) => Math.min(100, p + 10))}>+10</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overlay" className="space-y-4 pt-4">
          <Card style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 150px' }}>
            <CardHeader>
              <CardTitle>Dialog</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Dialog>
                <DialogTrigger render={<Button variant="outline">Open Dialog</Button>} />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Example Dialog</DialogTitle>
                    <DialogDescription>This is a dialog component from shadcn/ui.</DialogDescription>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">Dialog content goes here.</p>
                </DialogContent>
              </Dialog>
              <ConfirmDialog
                title="Delete item?"
                description="This action cannot be undone."
                onConfirm={() => toast.success('Deleted!')}
                trigger={<Button variant="destructive">Confirm Dialog</Button>}
              />
            </CardContent>
          </Card>

          <Card style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 150px' }}>
            <CardHeader>
              <CardTitle>Tooltip</CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
                  <TooltipContent>
                    <p>This is a tooltip</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4 pt-4">
          <Card style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 200px' }}>
            <CardHeader>
              <CardTitle>Card</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">Nested Card 1</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground">Card content.</p></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Nested Card 2</CardTitle></CardHeader>
                  <CardContent><p className="text-sm text-muted-foreground">Card content.</p></CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 150px' }}>
            <CardHeader>
              <CardTitle>Avatar &amp; Separator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar><AvatarImage src="" /><AvatarFallback>JD</AvatarFallback></Avatar>
                <Avatar><AvatarImage src="" /><AvatarFallback>AB</AvatarFallback></Avatar>
                <Avatar><AvatarImage src="" /><AvatarFallback>CD</AvatarFallback></Avatar>
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground">Content below separator.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4 pt-4">
          <Card style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 200px' }}>
            <CardHeader>
              <CardTitle>StatCard</CardTitle>
              <CardDescription>Dashboard metric cards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Contacts" value={847} icon={Users} trend={{ value: 23, label: 'this week', direction: 'up' }} />
                <StatCard title="New" value={23} icon={TrendingUp} trend={{ value: 5, label: 'vs last week', direction: 'up' }} />
                <StatCard title="Files" value={156} icon={FileText} />
                <StatCard title="Storage" value="1.2 GB" icon={HardDrive} />
              </div>
            </CardContent>
          </Card>

          <Card style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 150px' }}>
            <CardHeader>
              <CardTitle>RoleGuard</CardTitle>
              <CardDescription>Permission-based rendering</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RoleGuard permission="contacts.read">
                <p className="text-sm text-green-600">Visible to viewers+ (contacts.read)</p>
              </RoleGuard>
              <RoleGuard permission="contacts.write" fallback={<p className="text-sm text-muted-foreground">Hidden: requires contacts.write</p>}>
                <p className="text-sm text-green-600">Visible to editors+ (contacts.write)</p>
              </RoleGuard>
              <RoleGuard permission="users.write" fallback={<p className="text-sm text-muted-foreground">Hidden: requires users.write (admin only)</p>}>
                <p className="text-sm text-green-600">Visible to admins only (users.write)</p>
              </RoleGuard>
            </CardContent>
          </Card>

          <Card style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 150px' }}>
            <CardHeader>
              <CardTitle>PageHeader</CardTitle>
            </CardHeader>
            <CardContent>
              <PageHeader
                title="Example Page"
                breadcrumbs={[{ label: 'Admin', href: '#' }, { label: 'Example' }]}
                actions={<Button size="sm">Action</Button>}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
