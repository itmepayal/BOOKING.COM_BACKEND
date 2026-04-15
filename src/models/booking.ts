import { v4 as uuidv4 } from "uuid";
import { model, Schema, Types, Document } from "mongoose";
import { IUser } from "./user";
import { IHotel } from "./hotel";
import { IRoom } from "./room";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "checked_in"
  | "checked_out"
  | "no_show";

type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";

interface IGuest {
  adults: number;
  children: number;
  infants?: number;
}

interface IStay {
  checkInDate: Date;
  checkOutDate: Date;
  nights: number;
}

interface IPricing {
  basePrice: number;
  taxes: number;
  fees: number;
  discount: number;
  totalAmount: number;
  currency: string;
}

interface IStatusLog {
  status: BookingStatus;
  changedAt: Date;
}

export interface IBooking extends Document {
  bookingCode: string;
  userId: Types.ObjectId | IUser;
  hotelId: Types.ObjectId | IHotel;
  roomId: Types.ObjectId | IRoom;

  guests: IGuest;
  stay: IStay;

  status: BookingStatus;
  statusLogs: IStatusLog[];

  pricing: IPricing;
  paymentStatus: PaymentStatus;

  paymentId?: Types.ObjectId;

  specialRequests?: string;
  cancellationReason?: string;
  cancelledAt?: Date;

  checkInAt?: Date;
  checkOutAt?: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingCode: { type: String, unique: true },

    userId: { type: Types.ObjectId, ref: "User", required: true },
    hotelId: { type: Types.ObjectId, ref: "Hotel", required: true },
    roomId: { type: Types.ObjectId, ref: "Room", required: true },

    guests: {
      adults: { type: Number, required: true },
      children: { type: Number, default: 0 },
      infants: { type: Number, default: 0 },
    },

    stay: {
      checkInDate: { type: Date, required: true },
      checkOutDate: { type: Date, required: true },
      nights: { type: Number, required: true },
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "cancelled",
        "checked_in",
        "checked_out",
        "no_show",
      ],
      default: "pending",
    },

    statusLogs: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
      },
    ],

    pricing: {
      basePrice: Number,
      taxes: Number,
      fees: Number,
      discount: Number,
      totalAmount: Number,
      currency: { type: String, default: "INR" },
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid", "refunded"],
      default: "unpaid",
    },

    paymentId: { type: Types.ObjectId, ref: "Payment" },

    specialRequests: String,
    cancellationReason: String,
    cancelledAt: Date,

    checkInAt: Date,
    checkOutAt: Date,
  },
  { timestamps: true },
);

bookingSchema.pre("save", function (next) {
  if (!this.bookingCode) {
    this.bookingCode = `BK-${uuidv4().split("-")[0]}`;
  }
});

bookingSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusLogs = this.statusLogs || [];

    this.statusLogs.push({
      status: this.status,
      changedAt: new Date(),
    });
  }
});

export const Booking = model<IBooking>("Booking", bookingSchema);
