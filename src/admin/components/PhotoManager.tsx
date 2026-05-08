import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  deletePhoto,
  listPhotos,
  setCoverPhoto,
  updatePhoto,
  uploadPhoto,
} from "../api";
import { photoUrl } from "@/lib/supabase";

export const PhotoManager = ({
  propertyId,
  coverPhotoId,
}: {
  propertyId: string;
  coverPhotoId: string | null;
}) => {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: photos = [] } = useQuery({
    queryKey: ["admin-photos", propertyId],
    queryFn: () => listPhotos(propertyId),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-photos", propertyId] });
    qc.invalidateQueries({ queryKey: ["admin-property", propertyId] });
    qc.invalidateQueries({ queryKey: ["appartements"] });
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const start = photos.length;
      let i = 0;
      for (const f of Array.from(files)) {
        const order = start + i;
        const label = String(order + 1).padStart(2, "0");
        await uploadPhoto(propertyId, f, { label, caption: "", sort_order: order });
        i++;
      }
      toast.success(`${files.length} photo(s) uploadée(s)`);
      refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur d'upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onDelete = async (id: string, path: string) => {
    if (!confirm("Supprimer cette photo ?")) return;
    try {
      await deletePhoto(id, path);
      toast.success("Photo supprimée");
      refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const onSetCover = async (id: string) => {
    try {
      await setCoverPhoto(propertyId, id);
      toast.success("Photo principale définie");
      refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const onUpdateMeta = async (
    id: string,
    field: "label" | "caption",
    value: string,
  ) => {
    try {
      await updatePhoto(id, { [field]: value });
      refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const next = [...photos];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    try {
      await Promise.all(
        next.map((p, i) =>
          p.sort_order !== i ? updatePhoto(p.id, { sort_order: i }) : Promise.resolve(),
        ),
      );
      refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onFiles(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 bg-ink text-cream px-4 h-10 font-mono-meta text-sm hover:bg-copper transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4" /> {uploading ? "Upload…" : "Ajouter des photos"}
        </button>
        <span className="font-mono-meta text-xs text-slate">
          {photos.length} photo{photos.length > 1 ? "s" : ""}
        </span>
      </div>

      {photos.length === 0 ? (
        <p className="text-slate text-sm">Aucune photo. Upload tes premières photos.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {photos.map((p, idx) => {
            const isCover = p.id === coverPhotoId;
            return (
              <div key={p.id} className="border border-hairline bg-cream p-3">
                <div className="relative aspect-[4/3] bg-ink/5 mb-3">
                  <img
                    src={photoUrl(p.storage_path)}
                    alt={p.caption || p.label}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {isCover && (
                    <span className="absolute top-2 left-2 bg-copper text-cream font-mono-meta text-xs px-2 py-1">
                      ★ Couverture
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mb-2">
                  <input
                    defaultValue={p.label}
                    onBlur={(e) =>
                      e.target.value !== p.label && onUpdateMeta(p.id, "label", e.target.value)
                    }
                    placeholder="01"
                    className="w-16 border border-hairline bg-cream-soft px-2 py-1.5 text-sm"
                  />
                  <input
                    defaultValue={p.caption}
                    onBlur={(e) =>
                      e.target.value !== p.caption && onUpdateMeta(p.id, "caption", e.target.value)
                    }
                    placeholder="Légende"
                    className="flex-1 border border-hairline bg-cream-soft px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="w-8 h-8 border border-hairline hover:bg-ink hover:text-cream disabled:opacity-30"
                      title="Monter"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={idx === photos.length - 1}
                      className="w-8 h-8 border border-hairline hover:bg-ink hover:text-cream disabled:opacity-30"
                      title="Descendre"
                    >
                      ↓
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onSetCover(p.id)}
                      disabled={isCover}
                      className="w-8 h-8 border border-hairline hover:bg-copper hover:text-cream hover:border-copper disabled:opacity-30"
                      title="Définir comme couverture"
                    >
                      <Star className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(p.id, p.storage_path)}
                      className="w-8 h-8 border border-hairline hover:bg-red-700 hover:text-cream hover:border-red-700"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
