import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-primary/10 dark:bg-input',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
