"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import {
  Users,
  CheckCircle,
  Loader2,
  Download,
  Copy,
  QrCode,
  ImagePlus,
  X,
  Plus,
  Eye,
  Calendar,
  DollarSign,
} from "lucide-react";

type CampaignType = "funeral" | "charity" | "disaster" | "medical" | "other";

interface FormData {
  title: string;
  description: string;
  organizerName: string;
  organizerContact: string;
  bankAccount: string;
  bankName: string;
  campaignType: CampaignType;
  targetAmount: string;
  startDate: string;
  endDate: string;
}

interface QRModalData {
  campaignId: string;
  campaignTitle: string;
  bankAccount: string;
}

export default function OrganizerPage() {
  const { user, isLoading: authLoading } = useAuth();
  const createCampaign = useMutation(api.campaigns.create);
  const [campaignImage, setCampaignImage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [qrModal, setQrModal] = useState<QRModalData | null>(null);
  
  // Fetch organizer's campaigns
  const myCampaigns = useQuery(
    api.campaigns.listByOrganizer,
    user?._id ? { organizerId: user._id } : "skip"
  );

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    organizerName: "",
    organizerContact: "",
    bankAccount: "",
    bankName: "",
    campaignType: "funeral",
    targetAmount: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<{
    id: string;
    qrDataUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prefill organizer name from user profile
  useEffect(() => {
    if (user && !formData.organizerName) {
      setFormData((prev) => ({
        ...prev,
        organizerName: user.fullName,
        bankName: user.bankName || prev.bankName,
        bankAccount: user.bankAccount || prev.bankAccount,
      }));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setError("Image must be less than 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCampaignImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const campaignId = await createCampaign({
        title: formData.title,
        description: formData.description,
        organizerName: formData.organizerName,
        organizerContact: formData.organizerContact || undefined,
        bankAccount: formData.bankAccount,
        bankName: formData.bankName,
        campaignType: formData.campaignType,
        targetAmount: formData.targetAmount
          ? parseFloat(formData.targetAmount)
          : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        campaignImage: campaignImage || undefined,
        organizerId: user?._id,
      });

      // Generate QR code
      const qrPayload = JSON.stringify({
        type: "safe-donation",
        campaignId: campaignId,
        bankAccount: formData.bankAccount,
        version: 1,
      });

      // Use a simple QR code API for demo
      const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}`;

      setCreatedCampaign({
        id: campaignId,
        qrDataUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyQRPayload = () => {
    if (!createdCampaign) return;
    const payload = JSON.stringify({
      type: "safe-donation",
      campaignId: createdCampaign.id,
      bankAccount: formData.bankAccount,
      version: 1,
    });
    navigator.clipboard.writeText(payload);
  };

  if (createdCampaign) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <Header />

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {formData.title}
            </h2>
            <p className="text-gray-600 mb-6">
              Your verified donation campaign is now live!
            </p>

            {/* QR Code */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4">
                Your Verified QR Code
              </h3>
              <div className="bg-white p-4 rounded-xl inline-block shadow-sm">
                <Image
                  src={createdCampaign.qrDataUrl}
                  alt="Campaign QR Code"
                  width={200}
                  height={200}
                  className="mx-auto"
                />
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Share this QR code with donors. They can scan it to verify your
                campaign.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={createdCampaign.qrDataUrl}
                download={`${formData.title.replace(/\s+/g, "-")}-qr.png`}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download QR
              </a>
              <button
                onClick={copyQRPayload}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-5 h-5" />
                Copy QR Data
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <Link
                href="/scan"
                className="text-emerald-600 font-medium hover:text-emerald-700"
              >
                Test your QR code →
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in or create an account to create donation campaigns.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Create Account
            </Link>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* My Campaigns Section */}
        <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm mb-6">
          {/* Header - Stack on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 bg-blue-100 rounded-xl">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                  My Campaigns
                </h2>
                <p className="text-xs md:text-sm text-gray-600">
                  Manage your donation campaigns
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </button>
          </div>

          {/* Campaigns List */}
          {myCampaigns === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : myCampaigns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <QrCode className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>You haven&apos;t created any campaigns yet.</p>
              <p className="text-sm">Tap &quot;Create Campaign&quot; to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myCampaigns.map((campaign) => (
                <div
                  key={campaign._id}
                  className="border border-gray-100 rounded-xl p-3 md:p-4 hover:border-blue-200 transition-colors"
                >
                  {/* Mobile: Stack layout */}
                  <div className="flex gap-3">
                    {campaign.campaignImage && (
                      <img
                        src={campaign.campaignImage}
                        alt={campaign.title}
                        className="w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      {/* Title and Status */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-1">
                          {campaign.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                              campaign.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : campaign.status === "completed"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {campaign.status}
                          </span>
                          <button
                            onClick={() => setQrModal({
                              campaignId: campaign._id,
                              campaignTitle: campaign.title,
                              bankAccount: campaign.bankAccount,
                            })}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                            title="View QR Code"
                          >
                            <QrCode className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Description - hidden on very small screens */}
                      <p className="text-xs md:text-sm text-gray-600 line-clamp-1 mb-2 hidden sm:block">
                        {campaign.description}
                      </p>
                      
                      {/* Stats Grid - 2 columns on mobile */}
                      <div className="grid grid-cols-2 md:flex md:items-center gap-2 md:gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {new Date(campaign.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 flex-shrink-0" />
                          <span>RM {campaign.totalDonations?.toLocaleString() || 0}</span>
                        </span>
                        {campaign.targetAmount && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <span className="font-medium">Target:</span>
                            <span>RM {campaign.targetAmount.toLocaleString()}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 flex-shrink-0" />
                          <span>{campaign.donationCount || 0} donations</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Campaign Form */}
        {showCreateForm && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <QrCode className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Campaign
              </h2>
              <p className="text-sm text-gray-600">
                Get a verified QR code that donors can trust
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Image / Poster
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 transition-colors">
                {campaignImage ? (
                  <div className="relative inline-block">
                    <img
                      src={campaignImage}
                      alt="Campaign"
                      className="max-h-40 rounded-lg mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => setCampaignImage(null)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <ImagePlus className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">
                      Click to upload image (max 1MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Campaign Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Type *
              </label>
              <select
                name="campaignType"
                value={formData.campaignType}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="funeral">🕯️ Funeral / Memorial</option>
                <option value="medical">🏥 Medical Emergency</option>
                <option value="disaster">🌊 Disaster Relief</option>
                <option value="charity">❤️ Charity / NGO</option>
                <option value="other">📋 Other</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Funeral Fund for Ahmad bin Abdullah"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Briefly describe the purpose of this campaign..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                required
              />
            </div>

            {/* Organizer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organizer Name *
                </label>
                <input
                  type="text"
                  name="organizerName"
                  value={formData.organizerName}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact (optional)
                </label>
                <input
                  type="text"
                  name="organizerContact"
                  value={formData.organizerContact}
                  onChange={handleChange}
                  placeholder="Phone or email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Bank Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name *
                </label>
                <select
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select bank</option>
                  <option value="Ryt Bank">Ryt Bank</option>
                  <option value="Maybank">Maybank</option>
                  <option value="CIMB">CIMB Bank</option>
                  <option value="Public Bank">Public Bank</option>
                  <option value="RHB">RHB Bank</option>
                  <option value="Hong Leong">Hong Leong Bank</option>
                  <option value="AmBank">AmBank</option>
                  <option value="Bank Islam">Bank Islam</option>
                  <option value="Bank Rakyat">Bank Rakyat</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleChange}
                  placeholder="1234567890"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Target & Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Amount (RM)
                </label>
                <input
                  type="number"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Create Campaign
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        )}

        {/* QR Code Modal */}
        {qrModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {qrModal.campaignTitle}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Share this QR code with donors
                </p>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      JSON.stringify({
                        type: "safe-donation",
                        campaignId: qrModal.campaignId,
                        bankAccount: qrModal.bankAccount,
                        version: 1,
                      })
                    )}`}
                    alt="Campaign QR Code"
                    width={200}
                    height={200}
                    className="mx-auto"
                  />
                </div>
                <div className="flex gap-3">
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                      JSON.stringify({
                        type: "safe-donation",
                        campaignId: qrModal.campaignId,
                        bankAccount: qrModal.bankAccount,
                        version: 1,
                      })
                    )}`}
                    download={`${qrModal.campaignTitle.replace(/\s+/g, "-")}-qr.png`}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  <button
                    onClick={() => setQrModal(null)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
