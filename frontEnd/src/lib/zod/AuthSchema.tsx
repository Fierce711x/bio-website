import * as z from "zod";
import { StudentYear } from "../../auth/types";

export const LoginSchema = z.object({
  username: z
    .string({ error: "username must be a string" })
    .trim()
    .min(8, { error: "username must be atleast 8 characters long" })
    .max(50, { error: "username cant exceed 50 characters" })
    .toLowerCase(),
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    // Replicates @IsStrongPassword constraints using regex refinements:
    .refine(val => /[a-z]/.test(val), {
      error: "Password must contain at least one lowercase letter",
    })
    .refine(val => /[A-Z]/.test(val), {
      error: "Password must contain at least one uppercase letter",
    })
    .refine(val => /[0-9]/.test(val), {
      error: "Password must contain at least one number",
    }),
});

export const SignupSchema = z.object({
  username: z
    .string("username must be a string")
    .trim()
    .min(8, "username must be atleast 8 characters long")
    .max(50, "username cant exceed 50 characters")
    .toLowerCase(),
  year: z.enum(StudentYear),
  phone: z
    .string("Phone number is required")
    .trim()
    .refine(val => /^(?:\+20|0020|20)?0?1[0125]\d{8}$/.test(val), "Please enter a valid Egyptian mobile number (e.g., 01xxxxxxxxx)"),
  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .refine(val => /[a-z]/.test(val), "Password must contain at least one lowercase letter")
    .refine(val => /[A-Z]/.test(val), "Password must contain at least one uppercase letter")
    .refine(val => /[0-9]/.test(val), "Password must contain at least one number"),
});
