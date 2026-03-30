type FormSectionProps = {
  title: string;
  color?: 'amber' | 'blue' | 'green' | 'neutral' | 'primary';
  action?: React.ReactNode;
  children: React.ReactNode;
};

const colorStyles: Record<string, string> = {
  amber:
    'bg-amber-50 dark:bg-amber-950/30 [&_input]:bg-white [&_[data-slot=select-trigger]]:bg-white [&_button[data-slot=button]]:bg-white dark:[&_input]:bg-background dark:[&_[data-slot=select-trigger]]:bg-background dark:[&_button[data-slot=button]]:bg-background',
  blue: 'bg-blue-50 dark:bg-blue-950/30 [&_input]:bg-white [&_[data-slot=select-trigger]]:bg-white [&_button[data-slot=button]]:bg-white dark:[&_input]:bg-background dark:[&_[data-slot=select-trigger]]:bg-background dark:[&_button[data-slot=button]]:bg-background',
  green:
    'bg-green-50 dark:bg-green-950/30 [&_input]:bg-white [&_[data-slot=select-trigger]]:bg-white [&_button[data-slot=button]]:bg-white dark:[&_input]:bg-background dark:[&_[data-slot=select-trigger]]:bg-background dark:[&_button[data-slot=button]]:bg-background',
  neutral:
    'bg-muted/50 [&_input]:bg-white [&_[data-slot=select-trigger]]:bg-white [&_button[data-slot=button]]:bg-white dark:[&_input]:bg-background dark:[&_[data-slot=select-trigger]]:bg-background dark:[&_button[data-slot=button]]:bg-background',
  primary:
    'bg-primary/5 [&_input]:bg-white [&_[data-slot=select-trigger]]:bg-white [&_button[data-slot=button]]:bg-white dark:[&_input]:bg-background dark:[&_[data-slot=select-trigger]]:bg-background dark:[&_button[data-slot=button]]:bg-background',
};

export function FormSection({ title, color = 'neutral', action, children }: FormSectionProps) {
  return (
    <div className={`rounded-lg p-4 space-y-3 ${colorStyles[color]}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}
