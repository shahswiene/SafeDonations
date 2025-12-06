import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a report for suspicious activity
export const create = mutation({
  args: {
    campaignId: v.optional(v.id("campaigns")),
    qrPayload: v.optional(v.string()),
    reason: v.string(),
    reporterContact: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const reportId = await ctx.db.insert("reports", {
      ...args,
      status: "pending",
    });
    return reportId;
  },
});

// List reports (for admin)
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("reviewed"),
        v.literal("dismissed")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("reports")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(100);
    }
    return await ctx.db.query("reports").order("desc").take(100);
  },
});

// Update report status
export const updateStatus = mutation({
  args: {
    id: v.id("reports"),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("dismissed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});
