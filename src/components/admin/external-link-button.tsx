import { ExternalLink } from 'lucide-react';

type ExternalLinkButtonProps = {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
};

export function ExternalLinkButton({ href, onClick, children, className }: ExternalLinkButtonProps) {
  const classes = `inline-flex items-center gap-1.5 text-xs text-primary-action hover:underline ${className ?? ''}`.trim();

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        <ExternalLink className="h-3 w-3" />
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      <ExternalLink className="h-3 w-3" />
      {children}
    </button>
  );
}
