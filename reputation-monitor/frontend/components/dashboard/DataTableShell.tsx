import type { PropsWithChildren, ReactNode } from "react";
import Card from "@/components/dashboard/Card";

interface DataTableShellProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function DataTableShell({ title, subtitle, action, children }: DataTableShellProps) {
  return (
    <Card title={title} subtitle={subtitle} action={action}>
      <div className="px-5 pb-5 pt-4">{children}</div>
    </Card>
  );
}
