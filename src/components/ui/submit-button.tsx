'use client';

import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

type SubmitButtonProps = Omit<ButtonProps, 'type'> & {
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
