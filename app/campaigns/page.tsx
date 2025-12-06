"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Header from "@/components/Header";
import {
  Heart,
  Calendar,
  Users,
  CheckCircle,
} from "lucide-react";

export default function CampaignsPage() {
  const campaigns = useQuery(api.campaigns.listActive);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Active Donation Campaigns</h1>
          <p className="text-gray-600">
            All campaigns listed here are verified and safe to donate to.
          </p>
        </div>

        {campaigns === undefined ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-xl mb-4" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Campaigns</h2>
            <p className="text-gray-600">Check back later for new donation campaigns.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign._id} campaign={campaign} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface CampaignCardProps {
  campaign: {
    _id: string;
    title: string;
    description: string;
    organizerName: string;
    campaignType: string;
    targetAmount?: number;
    totalDonations?: number;
    donationCount?: number;
    startDate: string;
    endDate: string;
    bankAccount: string;
    campaignImage?: string;
    isVerified: boolean;
  };
}

function CampaignCard({ campaign }: CampaignCardProps) {
  const progress = campaign.targetAmount
    ? Math.min(100, ((campaign.totalDonations || 0) / campaign.targetAmount) * 100)
    : 0;

  const typeEmoji: Record<string, string> = {
    funeral: "🕯️",
    medical: "🏥",
    disaster: "🌊",
    charity: "❤️",
    other: "📋",
  };

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="h-40 bg-gradient-to-br from-emerald-100 to-emerald-50 relative">
        {campaign.campaignImage ? (
          <img
            src={campaign.campaignImage}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">{typeEmoji[campaign.campaignType] || "❤️"}</span>
          </div>
        )}
        {campaign.isVerified && (
          <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Verified
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-gray-500 capitalize">{campaign.campaignType}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{campaign.title}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{campaign.description}</p>

        {/* Progress */}
        {campaign.targetAmount && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-900">
                RM {(campaign.totalDonations || 0).toLocaleString()}
              </span>
              <span className="text-gray-500">of RM {campaign.targetAmount.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{campaign.donationCount || 0} donors</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{daysLeft} days left</span>
          </div>
        </div>

        {/* Organizer */}
        <div className="text-sm text-gray-500 mb-4">
          By <span className="font-medium text-gray-700">{campaign.organizerName}</span>
        </div>

        {/* Donate Button */}
        <Link
          href={`/scan?campaign=${campaign._id}`}
          className="block w-full text-center bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          Donate Now
        </Link>
      </div>
    </div>
  );
}
