import { Suspense } from "react";
import ReportClient from "./ReportClient";

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
          <p className="text-sm text-red-600">Loading report form...</p>
        </div>
      }
    >
      <ReportClient />
    </Suspense>
  );
}
