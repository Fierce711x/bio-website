import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../auth/hooks/useAuth";
import type { RedirectLocation } from "../types";
import Loading from "../../../components/Loading";
import { AuthState } from "../../../auth/types/contextTypes";

export default function RequireAuth() {
  const { authState, loading } = useAuth();
  const { pathname, search, hash } = useLocation();
  const redirect: RedirectLocation = {
    pathname,
    search,
    hash,
  };
  if (loading) {
    return <Loading />;
  }
  if (authState === AuthState.UnAuthenticate) {
    return <Navigate to={"/login"} replace state={{ from: redirect }} />;
  }
  return <Outlet />;
}
