import { cn } from '@/lib/utils';
import type { CSSProperties } from 'react';

export function CybervilleCredit({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <p className={cn('text-center text-xs', className)} style={style}>
      Designed &amp; developed by <span className="font-semibold">Cyberville</span>
    </p>
  );
}