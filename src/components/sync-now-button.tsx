'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSync } from '@/lib/use-sync';
import { useAppStore } from '@/lib/store';
import { RefreshCw, Check, AlertTriangle, CloudOff } from 'lucide-react';

interface SyncNowButtonProps {
  label?: string;
  /** Show the latest change count on the button */
  showCount?: boolean;
  /** For dark headers (e.g. the POS top bar): white translucent styling */
  inverted?: boolean;
  className?: string;
}

export function SyncNowButton({
  label = 'Sync',
  showCount = true,
  inverted = false,
  className = '',
}: SyncNowButtonProps) {
  const { syncNow, syncing, pendingCount, lastSyncError } = useSync();
  const isOnline = useAppStore((s) => s.isOnline);
  const [flash, setFlash] = useState<'synced' | 'offline' | 'error' | null>(null);

  const doSync = async () => {
    const result = await syncNow();
    if (result && !result.online) {
      setFlash('offline');
    } else if (result && result.error) {
      setFlash('error');
    } else {
      setFlash('synced');
    }
    window.setTimeout(() => setFlash(null), 3000);
  };

  const icon = syncing ? (
    <RefreshCw className="w-4 h-4 animate-spin" />
  ) : flash === 'synced' ? (
    <Check className="w-4 h-4" />
  ) : flash === 'offline' ? (
    <CloudOff className="w-4 h-4" />
  ) : flash === 'error' ? (
    <AlertTriangle className="w-4 h-4" />
  ) : (
    <RefreshCw className="w-4 h-4" />
  );

  const countSuffix = showCount && !syncing && pendingCount > 0 ? ` (${pendingCount})` : '';
  const text = syncing
    ? 'Syncing...'
    : flash === 'synced'
      ? 'Synced'
      : flash === 'offline'
        ? 'Offline'
        : flash === 'error'
          ? 'Retry'
          : label + countSuffix;

  const title = lastSyncError
    ? `Last sync error: ${lastSyncError}`
    : isOnline
      ? 'Push the latest changes from this system to all others, and pull the newest data'
      : 'Offline — the button will sync as soon as you are back online';

  const tone = inverted
    ? 'border-white/30 bg-white/15 text-white hover:bg-white/25'
    : '';

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={doSync}
      disabled={syncing}
      className={`${tone} ${className}`}
      title={title}
    >
      {icon}
      <span className="hidden sm:inline">{text}</span>
    </Button>
  );
}