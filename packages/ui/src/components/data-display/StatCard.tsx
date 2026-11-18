import type { ReactNode } from "react";
import { Card } from "./Card";
import { Skeleton } from "../feedback/Skeleton";
export interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  icon?: ReactNode;
  loading?: boolean;
}
/** Displays a single metric with optional trend and icon. @param props Metric copy and loading state. */
export function StatCard({ label, value, trend, icon, loading = false }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-foreground-muted">{label}</p>
          {loading ? (
            <Skeleton className="mt-2" width="half" height="lg" />
          ) : (
            <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          )}
          {trend && !loading ? <p className="mt-1 text-sm text-foreground-muted">{trend}</p> : null}
        </div>
        {icon}
      </div>
    </Card>
  );
}
