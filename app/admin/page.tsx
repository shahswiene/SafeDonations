"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  QrCode,
  Loader2,
  Flag,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const campaigns = useQuery(api.campaigns.list, {});
  const scanEvents = useQuery(api.scanEvents.list, { limit: 20 });
  const stats = useQuery(api.scanEvents.getStats);
  const pendingReports = useQuery(api.reports.list, { status: "pending" });
  const updateReportStatus = useMutation(api.reports.updateStatus);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);

  const handleStatusChange = async (
    reportId: string,
    newStatus: "reviewed" | "dismissed"
  ) => {
    try {
      setUpdatingReportId(reportId);
      await updateReportStatus({ id: reportId as any, status: newStatus });
    } catch (error) {
      console.error("Failed to update report status", error);
    } finally {
      setUpdatingReportId(null);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Show access denied if not admin
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            This page is only accessible to bank administrators.
          </p>
          <Link
            href="/"
            className="inline-block w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard
            label="Total Scans"
            value={stats?.total ?? 0}
            icon={<QrCode className="w-5 h-5 text-gray-600" />}
            color="gray"
          />
          <StatCard
            label="Verified"
            value={stats?.verified ?? 0}
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            color="emerald"
          />
          <StatCard
            label="Unverified"
            value={stats?.unverified ?? 0}
            icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
            color="amber"
          />
          <StatCard
            label="Suspicious"
            value={stats?.suspicious ?? 0}
            icon={<XCircle className="w-5 h-5 text-red-600" />}
            color="red"
          />
          <StatCard
            label="Blocked"
            value={stats?.blocked ?? 0}
            icon={<Shield className="w-5 h-5 text-purple-600" />}
            color="purple"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Campaigns List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">Campaigns</h2>
              </div>
              <span className="text-sm text-gray-500">
                {campaigns?.length ?? 0} total
              </span>
            </div>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {campaigns?.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No campaigns yet.{" "}
                  <Link href="/organizer" className="text-blue-600 hover:underline">
                    Create one
                  </Link>
                </div>
              )}
              {campaigns?.map((campaign) => (
                <div key={campaign._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {campaign.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {campaign.organizerName} • {campaign.campaignType}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {campaign.isVerified ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          Pending
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          campaign.status === "active"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span className="font-mono">{campaign.bankAccount}</span>
                    <span>
                      {campaign.donationCount ?? 0} donations • RM
                      {campaign.totalDonations ?? 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Scans */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-600" />
                <h2 className="font-semibold text-gray-900">Recent Scans</h2>
              </div>
              <span className="text-sm text-gray-500">
                Last {scanEvents?.length ?? 0}
              </span>
            </div>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {scanEvents?.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No scans yet.{" "}
                  <Link href="/scan" className="text-emerald-600 hover:underline">
                    Try scanning
                  </Link>
                </div>
              )}
              {scanEvents?.map((event) => (
                <div key={event._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {event.decision === "verified" && (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      )}
                      {event.decision === "unverified" && (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      {event.decision === "suspicious" && (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span
                        className={`text-sm font-medium capitalize ${
                          event.decision === "verified"
                            ? "text-emerald-700"
                            : event.decision === "unverified"
                              ? "text-amber-700"
                              : "text-red-700"
                        }`}
                      >
                        {event.decision}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        event.riskLevel === "low"
                          ? "bg-emerald-100 text-emerald-700"
                          : event.riskLevel === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {event.riskLevel} risk
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {event.explanation}
                  </p>
                  <div className="mt-2 text-xs text-gray-400 font-mono truncate">
                    {event.qrPayload.substring(0, 50)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Incident Reports */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-600" />
              <h2 className="font-semibold text-gray-900">Incident Reports</h2>
            </div>
            <span className="text-sm text-gray-500">
              {pendingReports?.length ?? 0} pending
            </span>
          </div>
          {pendingReports === undefined ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : pendingReports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No pending reports right now. Great job keeping donors safe!
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingReports.map((report) => (
                <div key={report._id} className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">
                      {report.reason}
                    </p>
                    <p className="text-xs text-gray-500 font-mono break-all">
                      {report.qrPayload || "No QR payload provided"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Contact: {report.reporterContact || "Not provided"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange(report._id, "reviewed")}
                      disabled={updatingReportId === report._id}
                      className="px-3 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      onClick={() => handleStatusChange(report._id, "dismissed")}
                      disabled={updatingReportId === report._id}
                      className="px-3 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "gray" | "emerald" | "amber" | "red" | "purple";
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const bgColors = {
    gray: "bg-gray-50",
    emerald: "bg-emerald-50",
    amber: "bg-amber-50",
    red: "bg-red-50",
    purple: "bg-purple-50",
  };

  return (
    <div className={`${bgColors[color]} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
