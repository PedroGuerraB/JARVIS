import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-5',
        'bg-[var(--card)] border-[var(--card-border)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn('mb-4 flex items-center justify-between', className)}>{children}</div>;
}

export function CardTitle({ className, children }: CardProps) {
  return <h3 className={cn('text-sm font-medium text-[var(--muted-fg)] uppercase tracking-wider', className)}>{children}</h3>;
}

export function CardValue({ className, children }: CardProps) {
  return <p className={cn('text-2xl font-bold text-[var(--foreground)]', className)}>{children}</p>;
}
