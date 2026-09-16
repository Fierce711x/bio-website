export enum AuthState {
  Authenticated = "Authenticated",
  UnAuthenticate = "UnAuthenticate",
  Unavailable = "Unavailable",
}
export interface AuthContextType {
  authState: AuthState | undefined;
  loading: boolean;
}
