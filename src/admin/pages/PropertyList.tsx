import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, X } from "lucide-react";
import { listProperties, deleteProperty, updateProperty } from "../api";
import { formatEuro } from "@/lib/format";
import { toast } from "sonner";

/** Normalise une ref : retire espaces + passe en minuscules pour comparaison souple. */
const normalizeRef = (s: string) => s.toLowerCase().replace(/\s+/g, "");

const PropertyList = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: listProperties,
  });

  const filtered = useMemo(() => {
    const q = normalizeRef(search);
    if (!q) return items;
    return items.filter((p) => normalizeRef(p.ref ?? "").includes(q));
  }, [items, search]);

  const onDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer "${name}" ? Cette action est définitive.`)) return;
    try {
      await deleteProperty(id);
      toast.success("Appartement supprimé");
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
      qc.invalidateQueries({ queryKey: ["appartements"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const togglePublish = async (id: string, current: boolean) => {
    try {
      await updateProperty(id, { is_published: !current });
      qc.invalidateQueries({ queryKey: ["admin-properties"] });
      qc.invalidateQueries({ queryKey: ["appartements"] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 md:px-10 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl md:text-4xl">Appartements</h1>
        <Link
          to="/admin/properties/new"
          className="inline-flex items-center gap-2 bg-ink text-cream px-4 h-10 font-mono-meta text-sm hover:bg-copper transition-colors"
        >
          <Plus className="w-4 h-4" /> Nouveau
        </Link>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par référence (ex: 4 BEAUMAR ES)"
            className="w-full border border-hairline bg-cream-soft pl-9 pr-9 h-10 font-mono-meta text-sm focus:outline-none focus:border-ink"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <span className="font-mono-meta text-xs text-slate">
          {search
            ? `${filtered.length} résultat${filtered.length > 1 ? "s" : ""} sur ${items.length}`
            : `${items.length} appartement${items.length > 1 ? "s" : ""}`}
        </span>
      </div>

      {isLoading ? (
        <div className="font-mono-meta text-slate">Chargement…</div>
      ) : items.length === 0 ? (
        <div className="border border-hairline bg-cream-soft p-8 text-center text-slate">
          Aucun appartement. Crée le premier.
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-hairline bg-cream-soft p-8 text-center text-slate">
          Aucune référence ne correspond à "{search}".
        </div>
      ) : (
        <div className="border border-hairline bg-cream-soft">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-hairline font-mono-meta text-xs text-slate">
            <span className="col-span-1">Ordre</span>
            <span className="col-span-4">Nom</span>
            <span className="col-span-3">Quartier</span>
            <span className="col-span-2">Loyer</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>
          {filtered.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-5 py-4 border-b border-hairline last:border-b-0 items-center"
            >
              <div className="md:col-span-1 font-mono-meta text-slate">#{p.sort_order}</div>
              <div className="md:col-span-4">
                <div className="font-display text-lg">
                  {p.name} <span className="italic-display">{p.name_italic}</span>
                </div>
                <div className="font-mono-meta text-xs text-slate mt-0.5">
                  Réf {p.ref} · /{p.slug}
                </div>
              </div>
              <div className="md:col-span-3 text-sm">{p.quartier}</div>
              <div className="md:col-span-2 font-display">{formatEuro(p.loyer_num)}</div>
              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => togglePublish(p.id, p.is_published)}
                  title={p.is_published ? "Dépublier" : "Publier"}
                  className="w-9 h-9 border border-hairline flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
                >
                  {p.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <Link
                  to={`/admin/properties/${p.id}`}
                  className="w-9 h-9 border border-hairline flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
                  title="Modifier"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => onDelete(p.id, `${p.name} ${p.name_italic}`)}
                  className="w-9 h-9 border border-hairline flex items-center justify-center hover:bg-red-700 hover:text-cream hover:border-red-700 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyList;
