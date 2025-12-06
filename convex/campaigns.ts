import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new donation campaign
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
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
    startDate: v.string(),
    endDate: v.string(),
    campaignImage: v.optional(v.string()), // Base64 encoded image
    organizerId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const campaignId = await ctx.db.insert("campaigns", {
      ...args,
      status: "active",
      isVerified: true, // Auto-verified when created through official channel
      totalDonations: 0,
      donationCount: 0,
    });
    return campaignId;
  },
});

// Get a campaign by ID
export const getById = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get campaign by bank account (for QR verification)
export const getByBankAccount = query({
  args: { bankAccount: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .withIndex("by_bankAccount", (q) => q.eq("bankAccount", args.bankAccount))
      .first();
  },
});

// List all campaigns (for admin)
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("expired"),
        v.literal("suspended"),
        v.literal("completed")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("campaigns")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(100);
    }
    return await ctx.db.query("campaigns").order("desc").take(100);
  },
});

// List active verified campaigns (for public display)
export const listActive = query({
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(50);

    // Filter to only show campaigns within date range
    return campaigns.filter(
      (c) => c.startDate <= now && c.endDate >= now && c.isVerified
    );
  },
});

// Update campaign status
export const updateStatus = mutation({
  args: {
    id: v.id("campaigns"),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("suspended"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

// List campaigns by organizer
export const listByOrganizer = query({
  args: { organizerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .filter((q) => q.eq(q.field("organizerId"), args.organizerId))
      .order("desc")
      .take(50);
  },
});

// Record a donation (increment counters)
export const recordDonation = mutation({
  args: {
    id: v.id("campaigns"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.id);
    if (!campaign) return;

    await ctx.db.patch(args.id, {
      totalDonations: (campaign.totalDonations || 0) + args.amount,
      donationCount: (campaign.donationCount || 0) + 1,
    });
  },
});
