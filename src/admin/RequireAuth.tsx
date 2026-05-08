import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { session, loading, configured } = useAuth();
  const loc = useLocation();

  if (!configured) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <h1 className="font-display text-3xl mb-4">Supabase non configuré</h1>
          <p className="text-slate">
            Renseigne les variables d'environnement <code>VITE_SUPABASE_URL</code> et{" "}
            <code>VITE_SUPABASE_ANON_KEY</code> dans Vercel pour activer le back-office.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="font-mono-meta text-slate">Chargement…</div>
      </div>
    );
  }

  if (!session) return <Navigate to="/admin/login" state={{ from: loc }} replace />;
  return children;
};
