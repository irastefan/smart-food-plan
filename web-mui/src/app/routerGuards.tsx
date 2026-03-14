import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../shared/api/http";

export function ProtectedRoute() {
  return getAccessToken() ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicOnlyRoute() {
  return getAccessToken() ? <Navigate to="/meal-plan" replace /> : <Outlet />;
}
