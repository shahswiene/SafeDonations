"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import jsQR from "jsqr";
import Header from "@/components/Header";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Send,
  Flag,
  Upload,
} from "lucide-react";

interface ScanResult {
  decision: "verified" | "unverified" | "suspicious";
  riskLevel: "low" | "medium" | "high";
  explanation: string;
  educationTip: string;
  campaign?: {
    title: string;
    organizerName: string;
    campaignType: string;
    bankAccount: string;
  };
}

export default function ScanPage() {
  // Fetch active campaigns for demo buttons
  const campaigns = useQuery(api.campaigns.listActive);
  
  const [qrInput, setQrInput] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle QR image upload and parse QR code
  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setQrImage(base64);
      
      // Parse QR code from image using jsQR
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Could not process image");
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          setQrInput(code.data);
          setError(null);
        } else {
          setError("Could not detect QR code in image. Try a clearer image or paste the QR content manually.");
          setQrInput("");
        }
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleScan = async () => {
    if (!qrInput.trim()) {
      setError("Please enter or paste QR code content");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrPayload: qrInput.trim(),
          amount: amount ? parseFloat(amount) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to verify QR code");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setQrInput("");
    setAmount("");
    setResult(null);
    setError(null);
  };

  // Demo: Load sample QR payloads using real campaign data
  const loadSampleVerified = () => {
    if (campaigns && campaigns.length > 0) {
      const campaign = campaigns[0];
      setQrInput(
        JSON.stringify({
          type: "safe-donation",
          campaignId: campaign._id,
          bankAccount: campaign.bankAccount,
          version: 1,
        })
      );
    } else {
      // Fallback: use bank account lookup
      setQrInput("1234567890");
    }
  };

  const loadSampleFake = () => {
    setQrInput("1987654321"); // Random account not in system
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {!result ? (
          <>
            {/* Input Section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Verify QR Code
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Upload a QR code image or paste the QR content to verify if it&apos;s a legitimate donation campaign.
              </p>

              {/* QR Image Upload */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-xl p-6 text-center mb-4 transition-colors ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-emerald-400"
                }`}
              >
                {qrImage ? (
                  <div className="relative inline-block">
                    <img
                      src={qrImage}
                      alt="QR Code"
                      className="max-h-40 rounded-lg mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setQrImage(null);
                        setQrInput("");
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-600 block mb-1">
                      Drag & drop QR image here, or click to upload
                    </span>
                    <span className="text-xs text-gray-400">
                      Supports PNG, JPG, GIF
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or paste QR content</span>
                </div>
              </div>

              <textarea
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder='Paste QR code content here (e.g., {"type":"safe-donation","campaignId":"..."} or bank account number)'
                className="w-full h-24 p-4 border border-gray-200 rounded-xl text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Donation Amount (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    RM
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleScan}
                disabled={isLoading}
                className="w-full mt-6 bg-emerald-600 text-white py-4 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Verify QR Code
                  </>
                )}
              </button>
            </div>

            {/* Demo Buttons */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Demo: Try Sample QR Codes
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={loadSampleVerified}
                  className="flex-1 py-3 px-4 bg-emerald-100 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200 transition-colors text-sm"
                >
                  ✓ Load Verified Campaign QR
                </button>
                <button
                  onClick={loadSampleFake}
                  className="flex-1 py-3 px-4 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors text-sm"
                >
                  ✗ Load Fake/Unverified QR
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Result Section */
          <ResultCard result={result} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

interface ResultCardProps {
  result: ScanResult;
  onReset: () => void;
}

function ResultCard({ result, onReset }: ResultCardProps) {
  const isVerified = result.decision === "verified";
  const isSuspicious = result.decision === "suspicious";

  const statusConfig = {
    verified: {
      icon: CheckCircle,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconColor: "text-emerald-600",
      title: "Verified Campaign",
      titleColor: "text-emerald-900",
    },
    unverified: {
      icon: AlertTriangle,
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconColor: "text-amber-600",
      title: "Unverified - Proceed with Caution",
      titleColor: "text-amber-900",
    },
    suspicious: {
      icon: XCircle,
      bg: "bg-red-50",
      border: "border-red-200",
      iconColor: "text-red-600",
      title: "Suspicious - High Risk",
      titleColor: "text-red-900",
    },
  };

  const config = statusConfig[result.decision];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div
        className={`${config.bg} ${config.border} border rounded-2xl p-6`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${config.bg}`}>
            <Icon className={`w-8 h-8 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <h2 className={`text-xl font-semibold ${config.titleColor} mb-2`}>
              {config.title}
            </h2>
            <p className="text-gray-700">{result.explanation}</p>
          </div>
        </div>

        {/* Campaign Details (if verified) */}
        {isVerified && result.campaign && (
          <div className="mt-6 pt-6 border-t border-emerald-200">
            <h3 className="text-sm font-medium text-emerald-700 mb-3">
              Campaign Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Campaign</span>
                <p className="font-medium text-gray-900">
                  {result.campaign.title}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Organizer</span>
                <p className="font-medium text-gray-900">
                  {result.campaign.organizerName}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Type</span>
                <p className="font-medium text-gray-900 capitalize">
                  {result.campaign.campaignType}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Account</span>
                <p className="font-medium text-gray-900 font-mono">
                  {result.campaign.bankAccount}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Education Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="text-sm font-medium text-blue-700 mb-2">
          💡 Safety Tip
        </h3>
        <p className="text-blue-800 text-sm">{result.educationTip}</p>
      </div>

      {/* Risk Level Badge */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-100">
        <span className="text-gray-600">Risk Level</span>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            result.riskLevel === "low"
              ? "bg-emerald-100 text-emerald-700"
              : result.riskLevel === "medium"
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          {result.riskLevel.toUpperCase()}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isVerified && result.campaign ? (
          <a
            href={`https://www.maybank2u.com.my/transfer?account=${result.campaign.bankAccount}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Proceed to Donate
          </a>
        ) : (
          <Link
            href={`/report?qr=${encodeURIComponent(result.explanation)}`}
            className="flex-1 bg-red-600 text-white py-4 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <Flag className="w-5 h-5" />
            Report as Scam
          </Link>
        )}
        <button
          onClick={onReset}
          className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          Scan Another
        </button>
      </div>

      {/* Warning for non-verified */}
      {!isVerified && (
        <div className="bg-gray-900 text-white rounded-2xl p-6 text-center">
          <p className="text-sm mb-2">
            ⚠️ If you still want to proceed, please verify directly with the
            organizer.
          </p>
          <p className="text-xs text-gray-400">
            Contact the family, charity, or organization before transferring
            money.
          </p>
        </div>
      )}
    </div>
  );
}
