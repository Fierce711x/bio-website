import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../../auth/hooks/useAuth";
import Loading from "../../../components/Loading";
import { AuthState } from "../../../auth/types/contextTypes";
export default function RequireGuest() {
  const { authState, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }
  if (authState === AuthState.Authenticated) {
    return <Navigate to={"/dashboard"} replace />;
  }
  return <Outlet />;
}
