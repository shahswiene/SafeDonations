import { mutation } from "./_generated/server";

// Seed sample campaigns for demo
export const seedDemoData = mutation({
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("campaigns").first();
    if (existing) {
      return { message: "Already seeded", count: 0 };
    }

    // Sample verified funeral campaign
    const funeralId = await ctx.db.insert("campaigns", {
      title: "Funeral Fund for Arif bin Hassan",
      description:
        "Our beloved brother Arif passed away on Dec 5, 2025. We are raising funds to cover funeral expenses and support his family during this difficult time.",
      organizerName: "Fatimah binti Hassan",
      organizerContact: "012-3456789",
      bankAccount: "1234567890",
      bankName: "Maybank",
      campaignType: "funeral",
      targetAmount: 15000,
      startDate: "2025-12-05",
      endDate: "2025-12-20",
      status: "active",
      isVerified: true,
      totalDonations: 3250,
      donationCount: 47,
    });

    // Sample verified medical campaign
    const medicalId = await ctx.db.insert("campaigns", {
      title: "Medical Fund for Baby Aisyah",
      description:
        "Baby Aisyah needs urgent heart surgery. Her family cannot afford the RM80,000 treatment cost. Please help save her life.",
      organizerName: "Hospital Kuala Lumpur Welfare",
      organizerContact: "hkl.welfare@hospital.gov.my",
      bankAccount: "5678901234",
      bankName: "CIMB",
      campaignType: "medical",
      targetAmount: 80000,
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      status: "active",
      isVerified: true,
      totalDonations: 42500,
      donationCount: 312,
    });

    // Sample disaster relief campaign
    const disasterId = await ctx.db.insert("campaigns", {
      title: "Flood Relief - Kelantan Dec 2025",
      description:
        "Severe flooding has affected thousands in Kelantan. Funds will be used for food, clean water, and temporary shelter.",
      organizerName: "Malaysian Red Crescent",
      organizerContact: "info@redcrescent.org.my",
      bankAccount: "9012345678",
      bankName: "Bank Islam",
      campaignType: "disaster",
      targetAmount: 500000,
      startDate: "2025-12-03",
      endDate: "2026-01-15",
      status: "active",
      isVerified: true,
      totalDonations: 127800,
      donationCount: 1543,
    });

    // Sample scan events
    await ctx.db.insert("scanEvents", {
      qrPayload: JSON.stringify({
        type: "safe-donation",
        campaignId: funeralId,
        bankAccount: "1234567890",
        version: 1,
      }),
      campaignId: funeralId,
      amount: 100,
      decision: "verified",
      riskLevel: "low",
      explanation:
        "This is a verified funeral fund for Arif bin Hassan. Your donation will go directly to the family.",
      educationTip:
        "This donation goes to a verified campaign. Always look for the verified badge before donating.",
      userAction: "proceeded",
    });

    await ctx.db.insert("scanEvents", {
      qrPayload: "1987654321",
      campaignId: undefined,
      amount: 50,
      decision: "unverified",
      riskLevel: "medium",
      explanation:
        "This QR code is not linked to any verified donation campaign. We cannot confirm where your money will go.",
      educationTip:
        "Scammers often create fake QR codes to hijack donations. Always verify with the organizer directly.",
      userAction: "cancelled",
    });

    await ctx.db.insert("scanEvents", {
      qrPayload: "SCAM-FAKE-QR-12345",
      campaignId: undefined,
      amount: 200,
      decision: "suspicious",
      riskLevel: "high",
      explanation:
        "Warning: This QR code shows patterns commonly associated with scams. Do not proceed with this donation.",
      educationTip:
        "In October 2025, scammers hijacked funeral donations using fake QR codes. Always verify before donating.",
      userAction: "reported",
    });

    return {
      message: "Demo data seeded successfully",
      count: 3,
      campaigns: [funeralId, medicalId, disasterId],
    };
  },
});
