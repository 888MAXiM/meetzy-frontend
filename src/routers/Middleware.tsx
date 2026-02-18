import { Navigate } from "react-router-dom";
import { ROUTES } from "../constants/route";
import { useAppSelector } from "../redux/hooks";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return isAuthenticated ? <>{children}</> : <Navigate to={ROUTES.Login} replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  return isAuthenticated ? <Navigate to={ROUTES.Messenger} replace /> : <>{children}</>;
};

export { ProtectedRoute, PublicRoute };
