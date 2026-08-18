import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ title, value, icon, change, changeType = 'neutral', className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change && (
            <p className={cn('text-xs mt-1', {
              'text-success': changeType === 'up',
              'text-danger': changeType === 'down',
              'text-muted-foreground': changeType === 'neutral',
            })}>
              {change}
            </p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-primary-50 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}
