import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME = {
  pm: "/pm/projects",
  client: "/client/projects",
  member: "/member/tasks",
};

export function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (user)
    return <Navigate to={ROLE_HOME[user.role] ?? "/dashboard"} replace />;

  return children;
}
