import { z } from "zod";

export const registerSchema = z.object({
  firstname: z.string().min(2, "First name is required"),
  lastname: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email"),
  role: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
