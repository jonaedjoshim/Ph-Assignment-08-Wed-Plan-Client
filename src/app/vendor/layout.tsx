import { Suspense, type ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-wedplan-cream" />}>
      <DashboardShell variant="vendor">{children}</DashboardShell>
    </Suspense>
  );
}
