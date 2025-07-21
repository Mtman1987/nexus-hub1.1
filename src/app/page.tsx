
"use client";

import { Sidebar } from "@/components/layout/sidebar";
import DashboardPage from '@/app/dashboard/page';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <DashboardPage />
      </main>
    </div>
  );
}

    