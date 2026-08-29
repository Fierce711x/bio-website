import * as z from "zod";
import { LoginSchema, SignupSchema } from "../../lib/zod/AuthSchema";

export type LoginData = z.infer<typeof LoginSchema>;
export type SignupData = z.infer<typeof SignupSchema>;

export const UserRole = {
  STUDENT: "STUDENT",
  TEACHER: "TEACHER",
} as const;

export const StudentGrade = {
  SEC_1: "SEC_1",
  SEC_2: "SEC_2",
  SEC_3: "SEC_3",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export type StudentGrade = (typeof StudentGrade)[keyof typeof StudentGrade];

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;

  login(userData: LoginData): Promise<void>;

  signup(userData: SignupData): Promise<void>;

  logout(): Promise<void>;

  refreshUser(): Promise<void>;
}
