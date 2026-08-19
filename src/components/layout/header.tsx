'use client';

import { useAppStore } from '@/lib/store';
import { useSync } from '@/lib/use-sync';
import { Menu, Wifi, WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const { toggleSidebar, isOnline } = useAppStore();
  const { pendingCount, syncing, syncNow } = useSync();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleString('en-SS', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-4 sticky top-0 z-30">
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-lg hover:bg-muted"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <span className="text-xs text-muted-foreground hidden sm:block">
        {currentTime}
      </span>

      {pendingCount > 0 && (
        <button
          onClick={() => syncNow()}
          disabled={!isOnline || syncing}
          className="flex items-center gap-1.5 text-xs text-accent bg-accent/10 px-3 py-1.5 rounded-full hover:bg-accent/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : `${pendingCount} pending`}
        </button>
      )}

      <div className="flex items-center gap-1.5">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-success" />
        ) : (
          <WifiOff className="w-4 h-4 text-danger" />
        )}
        <span className={`text-xs hidden sm:block ${isOnline ? 'text-success' : 'text-danger font-medium'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </header>
  );
}
