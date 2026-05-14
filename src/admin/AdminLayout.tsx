import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Wordmark } from "@/components/volums/Logo";

export const AdminLayout = () => {
  const { signOut } = useAuth();
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <header className="border-b border-hairline">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="text-ink"><Wordmark /></Link>
          <nav className="flex items-center gap-6 font-mono-meta text-sm">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                isActive ? "text-ink" : "text-slate hover:text-ink"
              }
            >
              Tableau de bord
            </NavLink>
            <NavLink
              to="/admin/properties"
              className={({ isActive }) =>
                isActive ? "text-ink" : "text-slate hover:text-ink"
              }
            >
              Appartements
            </NavLink>
            <button
              onClick={async () => {
                await signOut();
                nav("/admin/login");
              }}
              className="text-slate hover:text-ink"
            >
              Déconnexion
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
