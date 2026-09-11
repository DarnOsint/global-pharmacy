'use client';

import { useSync } from '@/lib/use-sync';

export function SyncProvider() {
  useSync();
  return null;
}