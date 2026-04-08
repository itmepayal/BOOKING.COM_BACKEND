import mongoose, { Types, Document, Model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ================= INTERFACE =================
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  role: "user" | "owner" | "admin";

  comparePassword(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

// ================= SCHEMA =================
const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    firstname: {
      type: String,
      required: true,
      trim: true,
    },
    lastname: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "owner", "admin"],
      default: "user",
    },
  },
  { timestamps: true, versionKey: false },
);

// ================= PRE SAVE =================
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

// ================= METHODS =================
userSchema.methods.comparePassword = async function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function (): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
  }

  return jwt.sign(
    {
      userId: this._id,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

// ================= TS-SAFE REMOVE PASSWORD =================
userSchema.set("toJSON", {
  transform: function (_doc, ret: IUser) {
    const { password, ...rest } = ret;
    return rest;
  },
});

// ================= MODEL =================
const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default User;
