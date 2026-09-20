'use client';

import { SidebarLayout } from '@/components/layout/SidebarLayout';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayout>
      {children}
    </SidebarLayout>
  );
}