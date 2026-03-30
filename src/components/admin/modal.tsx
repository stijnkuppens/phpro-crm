'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'wide' | 'extra-wide';
  /** Sticky footer content (buttons). Renders as a sticky bar at the bottom of the modal. */
  footer?: React.ReactNode;
};

const sizeClasses = {
  default: 'sm:max-w-lg',
  wide: 'sm:max-w-2xl',
  'extra-wide': 'sm:max-w-4xl',
};

export function Modal({ open, onClose, title, children, size = 'default', footer }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(sizeClasses[size], 'flex max-h-[92vh] flex-col overflow-hidden')}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-card px-4 py-3 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 sm:px-6">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Standalone footer for use inside modal children when the footer prop isn't convenient
 * (e.g. when buttons are inside a <form> that wraps the modal content).
 */
export function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'sticky bottom-0 -mx-4 -mb-4 flex items-center justify-end gap-2 border-t bg-card px-4 py-3 sm:-mx-6 sm:-mb-6 sm:px-6 mt-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
