'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:ml-64">
        <Header />
        <main className="p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
