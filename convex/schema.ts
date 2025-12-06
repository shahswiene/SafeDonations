import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users (organizers and admins)
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(), // Simple hash for demo (use proper auth in production)
    role: v.union(v.literal("organizer"), v.literal("admin")),
    fullName: v.string(),
    gender: v.optional(v.string()),
    age: v.optional(v.number()),
    race: v.optional(v.string()),
    ethnicity: v.optional(v.string()),
    profileImage: v.optional(v.string()), // Base64 encoded
    bankName: v.optional(v.string()),
    bankAccount: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Sessions for auth
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(), // Unix timestamp
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  // Donation campaigns (funeral, charity, disaster, etc.)
  campaigns: defineTable({
    title: v.string(),
    description: v.string(),
    organizerId: v.optional(v.id("users")), // Link to organizer
    organizerName: v.string(),
    organizerContact: v.optional(v.string()),
    bankAccount: v.string(),
    bankName: v.string(),
    campaignType: v.union(
      v.literal("funeral"),
      v.literal("charity"),
      v.literal("disaster"),
      v.literal("medical"),
      v.literal("other")
    ),
    targetAmount: v.optional(v.number()),
    startDate: v.string(), // ISO date string
    endDate: v.string(), // ISO date string
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("suspended"),
      v.literal("completed")
    ),
    isVerified: v.boolean(),
    totalDonations: v.optional(v.number()),
    donationCount: v.optional(v.number()),
    campaignImage: v.optional(v.string()), // Base64 encoded poster/image
  })
    .index("by_status", ["status"])
    .index("by_bankAccount", ["bankAccount"])
    .index("by_isVerified", ["isVerified"])
    .index("by_organizerId", ["organizerId"]),

  // Scan events when donors scan QR codes
  scanEvents: defineTable({
    qrPayload: v.string(), // The scanned QR content
    campaignId: v.optional(v.id("campaigns")), // Linked campaign if found
    amount: v.optional(v.number()),
    decision: v.union(
      v.literal("verified"),
      v.literal("unverified"),
      v.literal("suspicious")
    ),
    riskLevel: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    explanation: v.string(), // AI-generated explanation
    educationTip: v.optional(v.string()), // AI-generated scam education
    userAction: v.optional(
      v.union(
        v.literal("proceeded"),
        v.literal("cancelled"),
        v.literal("reported")
      )
    ),
  })
    .index("by_decision", ["decision"])
    .index("by_campaignId", ["campaignId"]),

  // Reports for suspicious campaigns
  reports: defineTable({
    campaignId: v.optional(v.id("campaigns")),
    qrPayload: v.optional(v.string()),
    reason: v.string(),
    reporterContact: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("dismissed")
    ),
  }).index("by_status", ["status"]),
});
