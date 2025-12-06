import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Record a scan event
export const create = mutation({
  args: {
    qrPayload: v.string(),
    campaignId: v.optional(v.id("campaigns")),
    amount: v.optional(v.number()),
    decision: v.union(
      v.literal("verified"),
      v.literal("unverified"),
      v.literal("suspicious")
    ),
    riskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    explanation: v.string(),
    educationTip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("scanEvents", {
      ...args,
      userAction: undefined,
    });
    return eventId;
  },
});

// Update user action on a scan event
export const updateUserAction = mutation({
  args: {
    id: v.id("scanEvents"),
    userAction: v.union(
      v.literal("proceeded"),
      v.literal("cancelled"),
      v.literal("reported")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { userAction: args.userAction });
  },
});

// List recent scan events (for admin)
export const list = query({
  args: {
    decision: v.optional(
      v.union(
        v.literal("verified"),
        v.literal("unverified"),
        v.literal("suspicious")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    if (args.decision) {
      return await ctx.db
        .query("scanEvents")
        .withIndex("by_decision", (q) => q.eq("decision", args.decision!))
        .order("desc")
        .take(limit);
    }
    return await ctx.db.query("scanEvents").order("desc").take(limit);
  },
});

// Get scan stats (for admin dashboard)
export const getStats = query({
  handler: async (ctx) => {
    const allEvents = await ctx.db.query("scanEvents").collect();

    const stats = {
      total: allEvents.length,
      verified: allEvents.filter((e) => e.decision === "verified").length,
      unverified: allEvents.filter((e) => e.decision === "unverified").length,
      suspicious: allEvents.filter((e) => e.decision === "suspicious").length,
      blocked: allEvents.filter(
        (e) => e.userAction === "cancelled" || e.userAction === "reported"
      ).length,
    };

    return stats;
  },
});
