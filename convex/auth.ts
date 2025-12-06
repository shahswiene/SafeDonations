import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple hash function for demo (use bcrypt in production)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16) + "_" + password.length;
}

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Register a new organizer
export const register = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    fullName: v.string(),
    gender: v.optional(v.string()),
    age: v.optional(v.number()),
    race: v.optional(v.string()),
    ethnicity: v.optional(v.string()),
    bankName: v.optional(v.string()),
    bankAccount: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existing) {
      throw new Error("Email already registered");
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      email: args.email.toLowerCase(),
      passwordHash: simpleHash(args.password),
      role: "organizer",
      fullName: args.fullName,
      gender: args.gender,
      age: args.age,
      race: args.race,
      ethnicity: args.ethnicity,
      bankName: args.bankName,
      bankAccount: args.bankAccount,
      profileImage: undefined,
      isActive: true,
    });

    // Create session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { userId, token };
  },
});

// Login
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.passwordHash !== simpleHash(args.password)) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Create new session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      userId: user._id,
      token,
      role: user.role,
      fullName: user.fullName,
    };
  },
});

// Logout
export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Get current user from token
export const getCurrentUser = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) {
      return null;
    }

    // Don't return password hash
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  },
});

// Update profile
export const updateProfile = mutation({
  args: {
    token: v.string(),
    fullName: v.optional(v.string()),
    gender: v.optional(v.string()),
    age: v.optional(v.number()),
    race: v.optional(v.string()),
    ethnicity: v.optional(v.string()),
    bankName: v.optional(v.string()),
    bankAccount: v.optional(v.string()),
    profileImage: v.optional(v.string()), // Base64
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Not authenticated");
    }

    const updates: Record<string, any> = {};
    if (args.fullName !== undefined) updates.fullName = args.fullName;
    if (args.gender !== undefined) updates.gender = args.gender;
    if (args.age !== undefined) updates.age = args.age;
    if (args.race !== undefined) updates.race = args.race;
    if (args.ethnicity !== undefined) updates.ethnicity = args.ethnicity;
    if (args.bankName !== undefined) updates.bankName = args.bankName;
    if (args.bankAccount !== undefined) updates.bankAccount = args.bankAccount;
    if (args.profileImage !== undefined) updates.profileImage = args.profileImage;

    await ctx.db.patch(session.userId, updates);
    return { success: true };
  },
});

// Change password
export const changePassword = mutation({
  args: {
    token: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.passwordHash !== simpleHash(args.currentPassword)) {
      throw new Error("Current password is incorrect");
    }

    await ctx.db.patch(session.userId, {
      passwordHash: simpleHash(args.newPassword),
    });

    return { success: true };
  },
});

// Seed admin user
export const seedAdmin = mutation({
  handler: async (ctx) => {
    // Check if admin already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "admin@rytbank.com"))
      .first();

    if (existing) {
      return { message: "Admin already exists", userId: existing._id };
    }

    const userId = await ctx.db.insert("users", {
      email: "admin@rytbank.com",
      passwordHash: simpleHash("admin123"), // Default password
      role: "admin",
      fullName: "Ryt Bank Admin",
      gender: undefined,
      age: undefined,
      race: undefined,
      ethnicity: undefined,
      profileImage: undefined,
      bankName: "Ryt Bank",
      bankAccount: undefined,
      isActive: true,
    });

    return { message: "Admin created", userId, email: "admin@rytbank.com", password: "admin123" };
  },
});
