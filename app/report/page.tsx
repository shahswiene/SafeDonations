"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Header from "@/components/Header";
import {
  Flag,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Send,
} from "lucide-react";

export default function ReportPage() {
  const searchParams = useSearchParams();
  const qrContent = searchParams.get("qr") || "";
  
  const createReport = useMutation(api.reports.create);
  
  const [formData, setFormData] = useState({
    description: "",
    contactEmail: "",
    qrContent: qrContent,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createReport({
        qrPayload: formData.qrContent || undefined,
        reason: formData.description,
        reporterContact: formData.contactEmail || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Report Submitted
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for helping protect others from potential scams. Our team will review your report.
            </p>
            <a
              href="/"
              className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 rounded-xl">
              <Flag className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Report Suspicious QR Code
              </h1>
              <p className="text-sm text-gray-600">
                Help protect others from potential scams
              </p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 mb-1">
                  Important Notice
                </h3>
                <p className="text-sm text-amber-700">
                  If you&apos;ve already sent money to a suspicious account, please contact your bank immediately and file a police report.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* QR Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Content / Bank Account
              </label>
              <textarea
                name="qrContent"
                value={formData.qrContent}
                onChange={handleChange}
                placeholder="Paste the QR code content or bank account number here"
                className="w-full h-24 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-sm"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What happened? *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe where you found this QR code and why you believe it's suspicious..."
                className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                required
              />
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email (optional)
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                We may contact you for more information about this report
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 text-white py-4 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Report
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Your report helps us protect the community from donation scams.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
