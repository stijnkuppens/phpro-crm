type FormSectionHeadingProps = {
  children: React.ReactNode;
};

export function FormSectionHeading({ children }: FormSectionHeadingProps) {
  return <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>;
}
