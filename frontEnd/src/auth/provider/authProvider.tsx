import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../context/authContext";
import { AuthState, type AuthContextType } from "../types/contextTypes";
import { connect } from "../api/auth";
import { queryKeys } from "../../lib/react-query/queryKeys";
import { Outlet } from "react-router";

export default function AuthProvider() {
  const { data: authState, isFetching: loading } = useQuery<AuthState>({ queryKey: queryKeys.ws, queryFn: connect });

  // async function logout() {
  //   await logoutRequest();
  //   return refreshConnection();
  // }

  const context: AuthContextType = { authState, loading };

  return (
    <AuthContext.Provider value={context}>
      <Outlet />
    </AuthContext.Provider>
  );
}
