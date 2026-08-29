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
