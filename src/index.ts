import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { connectDB } from "./db/connect";
import { errorHandler } from "./middlewares/error.middleware";
import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/user/user.routes";
import { hotelRouters } from "./modules/hotel/hotel.routes";

const app = express();

// ================= SECURITY MIDDLEWARES =================
app.use(helmet());

// ================= CORE MIDDLEWARES =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= CORS =================
app.use(
  cors({
    origin: [
      "https://bookingcom-eosin.vercel.app",
      "http://localhost:5173",
      "http://127.0.0.1:5174",
    ],
    credentials: true,
  }),
);

// ================= COOKIE =================
app.use(cookieParser());

// ================= ROUTES =================
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/hotels", hotelRouters);

// ================= ERROR HANDLER =================
app.use(errorHandler);

// ================= SERVER =================
const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
