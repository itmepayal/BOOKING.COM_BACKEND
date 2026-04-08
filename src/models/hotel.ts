import { model, Schema, Types, Document } from "mongoose";
import { IUser } from "./user";

// ================= INTERFACE =================
export interface IHotel extends Document {
  userId: Types.ObjectId | IUser;
  name: string;
  city: string;
  country: string;
  description?: string;
  type: "hotel" | "resort" | "apartment" | "hostel";
  adultsCount: number;
  childrenCount?: number;
  facilities?: string[];
  images?: string[];
  pricePerNight?: number;
  amenities?: string[];
  starRating?: number;
  createdAt?: Date;
  lastUpdated?: Date;
}

// ================= SCHEMA =================
const hotelSchema = new Schema<IHotel>(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ["hotel", "resort", "apartment", "hostel"],
      required: true,
    },
    adultsCount: { type: Number, required: true, min: 1 },
    childrenCount: { type: Number, default: 0, min: 0 },
    facilities: [{ type: String, required: true }],
    images: [{ type: String, required: true }],
    pricePerNight: { type: Number, min: 0 },
    amenities: [{ type: String, required: true }],
    starRating: { type: Number, min: 0, max: 5, default: 0 },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "lastUpdated" },
    versionKey: false,
  },
);

hotelSchema.index({ city: 1, type: 1 });

// ================= MODEL =================
export const Hotel = model<IHotel>("Hotel", hotelSchema);
