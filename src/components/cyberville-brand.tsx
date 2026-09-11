import { cn } from '@/lib/utils';

export function CybervilleCredit({ className }: { className?: string }) {
  return (
    <p className={cn('text-center text-xs', className)}>
      Designed &amp; developed by <span className="font-semibold">Cyberville</span>
    </p>
  );
}