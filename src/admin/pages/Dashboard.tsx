import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Database, HardDrive, Image as ImageIcon, RefreshCcw } from "lucide-react";
import { listProperties } from "../api";
import {
  fetchStorageStats,
  formatBytes,
  STORAGE_QUOTA_BYTES,
} from "../lib/storageStats";

const Dashboard = () => {
  const properties = useQuery({
    queryKey: ["admin-properties"],
    queryFn: listProperties,
  });

  const storage = useQuery({
    queryKey: ["admin-storage-stats"],
    queryFn: fetchStorageStats,
    staleTime: 60_000,
  });

  const props = properties.data ?? [];
  const published = props.filter((p) => p.is_published).length;
  const stats = storage.data;
  const usedPct = stats ? (stats.totalBytes / STORAGE_QUOTA_BYTES) * 100 : 0;
  const pctRounded = Math.min(100, Math.round(usedPct * 10) / 10);

  const barColor =
    usedPct >= 90
      ? "bg-red-700"
      : usedPct >= 70
        ? "bg-copper"
        : "bg-ink";

  return (
    <div className="mx-auto max-w-5xl px-6 md:px-10 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Tableau de bord</h1>
          <p className="font-mono-meta text-slate text-sm mt-1">
            Vue d'ensemble du site Volums.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            properties.refetch();
            storage.refetch();
          }}
          className="inline-flex items-center gap-2 border border-hairline px-4 h-10 font-mono-meta text-sm hover:bg-ink hover:text-cream transition-colors"
        >
          <RefreshCcw className={`w-4 h-4 ${storage.isFetching ? "animate-spin" : ""}`} />
          Rafraîchir
        </button>
      </div>

      {/* Storage block */}
      <section className="border border-hairline bg-cream-soft p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <HardDrive className="w-5 h-5 text-copper" />
          <h2 className="font-display text-xl">Stockage Supabase</h2>
        </div>

        {storage.isLoading ? (
          <p className="font-mono-meta text-slate text-sm">Calcul en cours…</p>
        ) : storage.isError ? (
          <p className="font-mono-meta text-red-700 text-sm">
            Impossible de calculer le stockage : {(storage.error as Error).message}
          </p>
        ) : stats ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
              <div>
                <span className="font-display text-4xl md:text-5xl">
                  {formatBytes(stats.totalBytes)}
                </span>
                <span className="font-mono-meta text-slate ml-3">
                  sur {formatBytes(STORAGE_QUOTA_BYTES, 0)}
                </span>
              </div>
              <span
                className={`font-mono-meta text-sm ${
                  usedPct >= 90 ? "text-red-700" : usedPct >= 70 ? "text-copper" : "text-slate"
                }`}
              >
                {pctRounded}% utilisé
              </span>
            </div>

            <div className="h-2 w-full bg-ink/10 overflow-hidden">
              <div
                className={`h-full ${barColor} transition-all`}
                style={{ width: `${Math.min(100, usedPct)}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Mini label="Photos" value={String(stats.fileCount)} />
              <Mini label="Apparts avec photos" value={String(stats.folderCount)} />
              <Mini
                label="Moyenne / photo"
                value={
                  stats.fileCount > 0
                    ? formatBytes(stats.totalBytes / stats.fileCount, 0)
                    : "—"
                }
              />
              <Mini label="Restant" value={formatBytes(Math.max(0, STORAGE_QUOTA_BYTES - stats.totalBytes), 0)} />
            </div>

            {usedPct >= 70 && (
              <p
                className={`mt-5 font-mono-meta text-xs ${
                  usedPct >= 90 ? "text-red-700" : "text-copper"
                }`}
              >
                {usedPct >= 90
                  ? "⚠️ Plus que 10% disponibles. Passer en plan Pro (25 $/mois pour 100 GB) ou supprimer des photos obsolètes."
                  : "À surveiller. Penser à supprimer les photos inutilisées."}
              </p>
            )}

            {stats.perFolder.length > 0 && (
              <details className="mt-6">
                <summary className="font-mono-meta text-sm text-slate cursor-pointer hover:text-ink">
                  Détail par appartement ({stats.perFolder.length})
                </summary>
                <div className="mt-4 max-h-80 overflow-y-auto border border-hairline">
                  <table className="w-full text-sm">
                    <thead className="bg-cream sticky top-0">
                      <tr className="text-left font-mono-meta text-slate">
                        <th className="px-4 py-2 font-normal">Property ID</th>
                        <th className="px-4 py-2 font-normal text-right">Photos</th>
                        <th className="px-4 py-2 font-normal text-right">Taille</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.perFolder.map((f) => (
                        <tr key={f.name} className="border-t border-hairline">
                          <td className="px-4 py-2 font-mono-meta text-xs text-slate">{f.name}</td>
                          <td className="px-4 py-2 text-right">{f.files}</td>
                          <td className="px-4 py-2 text-right font-mono-meta">
                            {formatBytes(f.bytes)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </>
        ) : null}

        <p className="font-mono-meta text-xs text-slate/70 mt-6">
          Quota du plan Free Supabase : 1 GB de stockage + 5 GB de bandwidth/mois. Le bandwidth
          (téléchargement des photos par les visiteurs) n'est pas mesurable depuis le front —
          voir Supabase → Settings → Usage.
        </p>
      </section>

      {/* Properties summary */}
      <section className="border border-hairline bg-cream-soft p-6 md:p-8 mt-8">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-5 h-5 text-copper" />
          <h2 className="font-display text-xl">Catalogue</h2>
        </div>
        {properties.isLoading ? (
          <p className="font-mono-meta text-slate text-sm">Chargement…</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Mini label="Total apparts" value={String(props.length)} />
            <Mini label="Publiés" value={String(published)} />
            <Mini label="Non publiés" value={String(props.length - published)} />
            <div>
              <div className="font-mono-meta text-xs text-slate mb-1">Actions</div>
              <Link
                to="/admin/properties"
                className="inline-flex items-center gap-2 font-mono-meta text-sm text-ink hover:text-copper"
              >
                <ImageIcon className="w-4 h-4" /> Gérer les appartements →
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

const Mini = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="font-mono-meta text-xs text-slate mb-1">{label}</div>
    <div className="font-display text-xl">{value}</div>
  </div>
);

export default Dashboard;
