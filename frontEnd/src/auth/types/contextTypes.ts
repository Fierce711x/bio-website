import type { AuthUser } from "./userTypes";
import type { LoginData, SignupData } from "./authTypes";
export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;

  login(userData: LoginData): Promise<void>;

  signup(userData: SignupData): Promise<void>;

  logout(): Promise<void>;

  refreshUser(): Promise<void>;
}
