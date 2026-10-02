"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import EmployeeProfileView from "@/components/employee/EmployeeProfileView";
import Button from "@/components/ui/Button";

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.id as string;

  return (
    <div className="min-h-screen bg-brand-background py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
          >
            ← Back to Daily Orders &amp; Staff
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/scan")}
            className="text-xs font-bold"
          >
            🎟️ Go to Scanner
          </Button>
        </div>

        <EmployeeProfileView
          employeeId={employeeId}
          onStartSessionForEmployee={(empName, counterName) => {
            sessionStorage.setItem("lottoscan_active_emp_name", empName);
            sessionStorage.setItem("lottoscan_active_counter_name", counterName || "");
            sessionStorage.setItem("lottoscan_active_emp_id", employeeId);
            router.push("/scan");
          }}
        />
      </div>
    </div>
  );
}
