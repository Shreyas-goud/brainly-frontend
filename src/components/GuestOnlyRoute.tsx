import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthContext";

export function GuestOnlyRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
