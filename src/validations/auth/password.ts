import { z } from "zod";

export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, "Old password is required")
      .min(6, "Old password must be at least 6 characters"),

    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(6, "New password must be at least 6 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
        "Must include uppercase, lowercase, and number",
      ),
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "New password must be different from old password",
    path: ["newPassword"],
  });
