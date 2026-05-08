import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Wordmark } from "@/components/volums/Logo";

const Login = () => {
  const { signIn, session, configured } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) {
    nav("/admin/properties", { replace: true });
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await signIn(email, pwd);
    setLoading(false);
    if (error) setErr(error);
    else nav("/admin/properties", { replace: true });
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm border border-hairline bg-cream-soft p-8"
      >
        <div className="mb-8 text-ink"><Wordmark /></div>
        <h1 className="font-display text-2xl">Back-office</h1>
        <p className="text-slate text-sm mt-1 mb-6">Accès réservé.</p>

        {!configured && (
          <p className="mb-4 p-3 bg-copper/10 text-ink text-sm border border-copper/30">
            Supabase n'est pas configuré. Renseigne les variables d'environnement.
          </p>
        )}

        <label className="block font-mono-meta text-xs text-slate mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-hairline bg-cream px-3 py-2 mb-4 focus:outline-none focus:border-ink"
        />
        <label className="block font-mono-meta text-xs text-slate mb-1">Mot de passe</label>
        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          required
          className="w-full border border-hairline bg-cream px-3 py-2 mb-4 focus:outline-none focus:border-ink"
        />

        {err && <p className="text-sm text-red-700 mb-3">{err}</p>}

        <button
          disabled={loading || !configured}
          className="w-full bg-ink text-cream py-3 font-mono-meta hover:bg-copper transition-colors disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
};

export default Login;
