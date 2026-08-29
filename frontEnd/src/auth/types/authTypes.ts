import * as z from "zod";
import { LoginSchema, SignupSchema } from "../../lib/zod/AuthSchema";

export type LoginData = z.infer<typeof LoginSchema>;
export type SignupData = z.infer<typeof SignupSchema>;
