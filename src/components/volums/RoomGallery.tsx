import { useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import type { TranslationKey } from "@/i18n/translations";
import type { Photo, RoomKey } from "@/data/types";

// Ordre d'affichage des pièces dans la galerie.
const ROOM_ORDER: RoomKey[] = [
  "salon",
  "salle_a_manger",
  "cuisine",
  "chambre",
  "sdb",
  "bureau",
  "entree",
  "exterieur",
  "autre",
];

type Group = {
  key: string;
  room: RoomKey;
  index: number | null;
  photos: Photo[];
};

const groupKey = (room: RoomKey, idx: number | null) =>
  idx != null ? `${room}-${idx}` : room;

/** Regroupe les photos par pièce, dans l'ordre ROOM_ORDER puis room_index. */
const buildGroups = (photos: Photo[]): Group[] => {
  const map = new Map<string, Group>();
  for (const p of photos) {
    const room = (p.room ?? "autre") as RoomKey;
    const idx = room === "chambre" || room === "sdb" ? p.roomIndex ?? null : null;
    const key = groupKey(room, idx);
    if (!map.has(key)) map.set(key, { key, room, index: idx, photos: [] });
    map.get(key)!.photos.push(p);
  }
  return [...map.values()].sort((a, b) => {
    const ra = ROOM_ORDER.indexOf(a.room);
    const rb = ROOM_ORDER.indexOf(b.room);
    if (ra !== rb) return ra - rb;
    return (a.index ?? 0) - (b.index ?? 0);
  });
};

export const RoomGallery = ({
  photos,
  open,
  onClose,
  startPhotoId,
}: {
  photos: Photo[];
  open: boolean;
  onClose: () => void;
  startPhotoId?: string;
}) => {
  const { t } = useLang();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [lightbox, setLightbox] = useState<number | null>(null);

  const groups = useMemo(() => buildGroups(photos), [photos]);
  // Liste plate dans l'ordre d'affichage — pour la navigation lightbox.
  const flat = useMemo(() => groups.flatMap((g) => g.photos), [groups]);

  const label = (g: Group) =>
    t(`room.${g.room}` as TranslationKey) + (g.index != null ? ` ${g.index}` : "");

  // Ouvre la lightbox sur la photo de départ si fournie.
  useEffect(() => {
    if (open && startPhotoId) {
      const i = flat.findIndex((p) => p.id === startPhotoId);
      if (i >= 0) setLightbox(i);
    }
    if (!open) setLightbox(null);
  }, [open, startPhotoId, flat]);

  // Bloque le scroll du body quand la galerie est ouverte.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Clavier : Échap ferme, flèches naviguent dans la lightbox.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightbox !== null) setLightbox(null);
        else onClose();
      }
      if (lightbox !== null) {
        if (e.key === "ArrowRight") setLightbox((i) => (i === null ? null : (i + 1) % flat.length));
        if (e.key === "ArrowLeft")
          setLightbox((i) => (i === null ? null : (i - 1 + flat.length) % flat.length));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, lightbox, flat.length, onClose]);

  if (!open) return null;

  const scrollToSection = (key: string) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="fixed inset-0 z-50 bg-cream text-ink flex flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-hairline bg-cream/95 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8 h-14 flex items-center justify-between">
          <span className="font-mono-meta text-sm">{t("gallery.title")}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("gallery.close")}
            className="w-9 h-9 flex items-center justify-center border border-hairline hover:bg-ink hover:text-cream transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav strip — vignettes par pièce */}
        <div className="mx-auto max-w-[1200px] px-5 md:px-8 pb-3 flex gap-3 overflow-x-auto">
          {groups.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => scrollToSection(g.key)}
              className="shrink-0 group text-left"
            >
              <div className="w-24 h-16 md:w-28 md:h-20 overflow-hidden bg-ink/5 border border-hairline">
                <img
                  src={g.photos[0]?.src}
                  alt={label(g)}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="font-mono-meta text-[0.62rem] text-slate mt-1 group-hover:text-ink transition-colors">
                {label(g)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Body — sections par pièce */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1100px] px-5 md:px-8 py-10 md:py-14">
          {groups.map((g) => {
            const [first, ...rest] = g.photos;
            return (
              <section
                key={g.key}
                ref={(el) => (sectionRefs.current[g.key] = el)}
                className="mb-14 md:mb-20 scroll-mt-32"
              >
                <h2 className="font-display text-2xl md:text-3xl mb-5">{label(g)}</h2>

                {first && (
                  <button
                    type="button"
                    onClick={() => setLightbox(flat.findIndex((p) => p === first))}
                    className="block w-full aspect-[16/10] overflow-hidden bg-ink/5 mb-2 group"
                  >
                    <img
                      src={first.src}
                      alt={first.caption || label(g)}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  </button>
                )}

                {rest.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {rest.map((p) => (
                      <button
                        key={p.id ?? p.src}
                        type="button"
                        onClick={() => setLightbox(flat.findIndex((x) => x === p))}
                        className="block aspect-[4/3] overflow-hidden bg-ink/5 group"
                      >
                        <img
                          src={p.src}
                          alt={p.caption || label(g)}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && flat[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-ink/95 flex items-center justify-center p-4 md:p-10"
          onClick={() => setLightbox(null)}
        >
          <button
            aria-label={t("detail.lightbox.close")}
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 text-cream/80 hover:text-cream w-10 h-10 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            aria-label={t("detail.lightbox.prev")}
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i === null ? null : (i - 1 + flat.length) % flat.length));
            }}
            className="absolute left-3 md:left-8 text-cream/80 hover:text-cream w-12 h-12 flex items-center justify-center"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            aria-label={t("detail.lightbox.next")}
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i === null ? null : (i + 1) % flat.length));
            }}
            className="absolute right-3 md:right-8 text-cream/80 hover:text-cream w-12 h-12 flex items-center justify-center"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
          <figure className="max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={flat[lightbox].src}
              alt={flat[lightbox].caption}
              className="w-full max-h-[80vh] object-contain"
            />
            <figcaption className="mt-4 flex items-center justify-between text-cream/80 font-mono-meta">
              <span>{flat[lightbox].caption}</span>
              <span>
                {lightbox + 1} / {flat.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
};
