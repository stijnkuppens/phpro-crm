'use client';

import { Loader2 } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, 'type'> & {
  icon?: ReactNode;
};

export function SubmitButton({ children, icon, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? <Loader2 className="animate-spin" /> : icon}
      {children}
    </Button>
  );
}
