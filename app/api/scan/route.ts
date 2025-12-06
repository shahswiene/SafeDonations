import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { parseQRPayload, extractBankAccount } from "@/lib/qr";
import { analyzeQRScan, type CampaignInfo } from "@/lib/groq";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrPayload, amount } = body;

    if (!qrPayload) {
      return NextResponse.json(
        { error: "QR payload is required" },
        { status: 400 }
      );
    }

    // Try to parse as SafeDonation QR
    const parsedQR = parseQRPayload(qrPayload);
    let campaign = null;
    let campaignInfo: CampaignInfo | null = null;

    if (parsedQR) {
      // It's a SafeDonation QR - look up by campaign ID
      try {
        campaign = await convex.query(api.campaigns.getById, {
          id: parsedQR.campaignId as any,
        });
      } catch {
        // Campaign not found
        campaign = null;
      }
    } else {
      // Try to extract bank account and look up
      const bankAccount = extractBankAccount(qrPayload);
      if (bankAccount) {
        campaign = await convex.query(api.campaigns.getByBankAccount, {
          bankAccount,
        });
      }
    }

    // Build campaign info for AI analysis
    if (campaign) {
      const now = new Date().toISOString();
      const isActive =
        campaign.status === "active" &&
        campaign.startDate <= now &&
        campaign.endDate >= now;

      campaignInfo = {
        title: campaign.title,
        description: campaign.description,
        organizerName: campaign.organizerName,
        bankAccount: campaign.bankAccount,
        isVerified: campaign.isVerified,
        isActive,
        campaignType: campaign.campaignType,
      };
    }

    // Get AI analysis
    const analysis = await analyzeQRScan(qrPayload, campaignInfo, amount);

    // Record the scan event
    await convex.mutation(api.scanEvents.create, {
      qrPayload,
      campaignId: campaign?._id,
      amount,
      decision: analysis.decision,
      riskLevel: analysis.riskLevel,
      explanation: analysis.explanation,
      educationTip: analysis.educationTip,
    });

    // Return result
    return NextResponse.json({
      decision: analysis.decision,
      riskLevel: analysis.riskLevel,
      explanation: analysis.explanation,
      educationTip: analysis.educationTip,
      campaign: campaign
        ? {
            title: campaign.title,
            organizerName: campaign.organizerName,
            campaignType: campaign.campaignType,
            bankAccount: campaign.bankAccount,
          }
        : undefined,
    });
  } catch (error) {
    console.error("Scan API error:", error);
    return NextResponse.json(
      { error: "Failed to process scan" },
      { status: 500 }
    );
  }
}
