import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../context/authContext";
import type { AuthContextType } from "../types/contextTypes";
import { loginRequest, logoutRequest, getCurrentUser, signupRequest } from "../api/auth";
import type { LoginData, SignupData } from "../types/authTypes";
import { queryKeys } from "../../lib/react-query/queryKeys";
import { Outlet } from "react-router";
export default function AuthProvider() {
  const { data: user = null, isLoading: loading } = useQuery({ queryKey: queryKeys.me, queryFn: getCurrentUser });
  const queryClient = useQueryClient();

  function refreshUser() {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.me,
    });
  }

  async function login(userData: LoginData) {
    await loginRequest(userData);
    return refreshUser();
  }

  async function logout() {
    await logoutRequest();
    return refreshUser();
  }

  async function signup(userData: SignupData) {
    await signupRequest(userData);
    return refreshUser();
  }

  const context: AuthContextType = { user, loading, refreshUser, logout, login, signup };

  return (
    <AuthContext.Provider value={context}>
      <Outlet />
    </AuthContext.Provider>
  );
}
