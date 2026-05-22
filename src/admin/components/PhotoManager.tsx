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
import { compressImage, formatBytes } from "../lib/compressImage";

// Options du menu "Pièce". value = "room" ou "room:index" ; "" = non classé.
const ROOM_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "— Pièce —" },
  { value: "salon", label: "Salon" },
  { value: "salle_a_manger", label: "Salle à manger" },
  { value: "cuisine", label: "Cuisine" },
  { value: "chambre", label: "Chambre" },
  { value: "chambre:1", label: "Chambre 1" },
  { value: "chambre:2", label: "Chambre 2" },
  { value: "chambre:3", label: "Chambre 3" },
  { value: "chambre:4", label: "Chambre 4" },
  { value: "chambre:5", label: "Chambre 5" },
  { value: "sdb", label: "Salle de bains" },
  { value: "sdb:1", label: "Salle de bains 1" },
  { value: "sdb:2", label: "Salle de bains 2" },
  { value: "sdb:3", label: "Salle de bains 3" },
  { value: "entree", label: "Entrée" },
  { value: "bureau", label: "Bureau" },
  { value: "exterieur", label: "Extérieur" },
  { value: "autre", label: "Autre" },
];

const roomToValue = (room?: string | null, index?: number | null) =>
  room ? (index != null ? `${room}:${index}` : room) : "";

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
  const [progress, setProgress] = useState<{
    phase: "upload" | "classify";
    current: number;
    total: number;
    savedBytes: number;
  } | null>(null);

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
    const list = Array.from(files);
    setProgress({ phase: "upload", current: 0, total: list.length, savedBytes: 0 });
    let savedBytes = 0;
    const uploaded: { id: string; storage_path: string }[] = [];
    try {
      const start = photos.length;
      let i = 0;
      for (const f of list) {
        setProgress({ phase: "upload", current: i + 1, total: list.length, savedBytes });
        // Compression côté navigateur AVANT upload (max 2000 px, JPEG q=0.82).
        const { file, originalSize, finalSize } = await compressImage(f);
        savedBytes += Math.max(0, originalSize - finalSize);
        const order = start + i;
        const label = String(order + 1).padStart(2, "0");
        const photo = (await uploadPhoto(propertyId, file, {
          label,
          caption: "",
          sort_order: order,
        })) as { id: string; storage_path: string };
        uploaded.push({ id: photo.id, storage_path: photo.storage_path });
        i++;
        setProgress({ phase: "upload", current: i, total: list.length, savedBytes });
      }
      toast.success(
        savedBytes > 0
          ? `${list.length} photo(s) — ${formatBytes(savedBytes)} économisés`
          : `${list.length} photo(s) uploadée(s)`,
      );
      refresh();

      // Classement automatique par pièce (Gemini Vision, via /api/classify-room).
      // Par lots : un seul appel pour plusieurs photos → reste sous la limite
      // de débit. Tolérant aux erreurs — une photo non classée reste réglable
      // à la main dans le menu « Pièce ».
      const BATCH = 6;
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      let classified = 0;
      let done = 0;
      for (let k = 0; k < uploaded.length; k += BATCH) {
        const batch = uploaded.slice(k, k + BATCH);
        setProgress({
          phase: "classify",
          current: done,
          total: uploaded.length,
          savedBytes,
        });
        // Jusqu'à 3 tentatives : sur 429 (limite de débit Gemini) on patiente
        // puis on réessaie le lot. Tolérant aux erreurs sinon.
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const res = await fetch("/api/classify-room", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrls: batch.map((p) => photoUrl(p.storage_path)),
              }),
            });
            if (res.ok) {
              const { rooms } = (await res.json()) as { rooms?: string[] };
              if (Array.isArray(rooms) && rooms.length === batch.length) {
                await Promise.all(
                  batch.map((p, idx) => {
                    const room = rooms[idx];
                    if (!room) return Promise.resolve();
                    classified++;
                    return updatePhoto(p.id, { room });
                  }),
                );
              }
              break;
            }
            if (res.status === 429 && attempt < 2) {
              await sleep(25000);
              continue;
            }
            break;
          } catch {
            break;
          }
        }
        done += batch.length;
        setProgress({
          phase: "classify",
          current: done,
          total: uploaded.length,
          savedBytes,
        });
      }
      if (classified > 0) {
        toast.success(
          `${classified}/${uploaded.length} photo(s) classée(s) automatiquement`,
        );
      }
      refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur d'upload");
    } finally {
      setUploading(false);
      setProgress(null);
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
      // La photo de couverture remonte en 1re position de la liste.
      const cover = photos.find((p) => p.id === id);
      if (cover) {
        const reordered = [cover, ...photos.filter((p) => p.id !== id)];
        await Promise.all(
          reordered.map((p, i) =>
            p.sort_order !== i
              ? updatePhoto(p.id, { sort_order: i })
              : Promise.resolve(),
          ),
        );
      }
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

  const onUpdateRoom = async (id: string, value: string) => {
    const [room, idx] = value ? value.split(":") : [null, undefined];
    try {
      await updatePhoto(id, {
        room: room || null,
        room_index: idx ? parseInt(idx) : null,
      });
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
          <Upload className="w-4 h-4" />{" "}
          {uploading
            ? progress
              ? progress.phase === "classify"
                ? `Classement ${progress.current}/${progress.total}…`
                : `Compression & upload ${progress.current}/${progress.total}…`
              : "Upload…"
            : "Ajouter des photos"}
        </button>
        <span className="font-mono-meta text-xs text-slate">
          {photos.length} photo{photos.length > 1 ? "s" : ""}
        </span>
      </div>
      {!uploading && (
        <p className="font-mono-meta text-xs text-slate/70">
          Les photos sont automatiquement redimensionnées (max 2000 px) et compressées (JPEG)
          avant l'envoi.
        </p>
      )}

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
                <div className="mb-2">
                  <select
                    value={roomToValue(p.room, p.room_index)}
                    onChange={(e) => onUpdateRoom(p.id, e.target.value)}
                    className={`w-full border bg-cream-soft px-2 py-1.5 text-sm ${
                      p.room ? "border-hairline" : "border-copper text-copper"
                    }`}
                  >
                    {ROOM_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
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
