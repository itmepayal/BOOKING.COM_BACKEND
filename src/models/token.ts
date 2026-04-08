import mongoose, { Document, Model } from "mongoose";

// ================= INTERFACE =================
export interface ITokenBlacklist extends Document {
  token: string;
  expiresAt: Date;
}

// ================= SCHEMA =================
const tokenBlacklistSchema = new mongoose.Schema<ITokenBlacklist>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// ================= AUTO DELETE (TTL INDEX) =================
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ================= MODEL =================
const TokenBlacklist: Model<ITokenBlacklist> = mongoose.model<ITokenBlacklist>(
  "TokenBlacklist",
  tokenBlacklistSchema,
);

export default TokenBlacklist;
