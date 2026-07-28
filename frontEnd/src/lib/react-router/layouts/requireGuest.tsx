import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../../auth/hooks/useAuth";
import Loading from "../../../components/Loading";
export default function RequireGuest() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }
  if (user) {
    return <Navigate to={"/dashboard"} replace />;
  }
  return <Outlet />;
}
