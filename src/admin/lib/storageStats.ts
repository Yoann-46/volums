import { supabase, PHOTOS_BUCKET } from "@/lib/supabase";

export type StorageStats = {
  totalBytes: number;
  fileCount: number;
  folderCount: number;
  /** Octets par dossier (= property_id). */
  perFolder: { name: string; bytes: number; files: number }[];
};

const PAGE_SIZE = 1000;

const listAllAtPrefix = async (prefix: string) => {
  if (!supabase) throw new Error("Supabase non configuré");
  const out: Array<{ name: string; size: number; isFolder: boolean }> = [];
  let offset = 0;
  // Pagination — `list` renvoie au max 1000 entrées par appel.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .list(prefix, { limit: PAGE_SIZE, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const entry of data) {
      // Supabase : un "dossier" virtuel n'a pas de metadata, un fichier a metadata.size.
      const size = (entry.metadata as { size?: number } | null | undefined)?.size ?? 0;
      const isFolder = !entry.metadata;
      out.push({ name: entry.name, size, isFolder });
    }
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return out;
};

export const fetchStorageStats = async (): Promise<StorageStats> => {
  // 1) Liste les dossiers à la racine (= un dossier par property_id).
  const root = await listAllAtPrefix("");
  const folders = root.filter((e) => e.isFolder);

  const perFolder: StorageStats["perFolder"] = [];
  let totalBytes = 0;
  let fileCount = 0;

  // 2) Pour chaque dossier, somme la taille des fichiers (avec pagination).
  //    Parallélisme limité pour ne pas exploser de requêtes simultanées.
  const CONCURRENCY = 6;
  let i = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (i < folders.length) {
        const idx = i++;
        const folder = folders[idx];
        const files = await listAllAtPrefix(folder.name);
        let bytes = 0;
        let count = 0;
        for (const f of files) {
          if (!f.isFolder) {
            bytes += f.size;
            count += 1;
          }
        }
        perFolder.push({ name: folder.name, bytes, files: count });
        totalBytes += bytes;
        fileCount += count;
      }
    }),
  );

  perFolder.sort((a, b) => b.bytes - a.bytes);

  return {
    totalBytes,
    fileCount,
    folderCount: folders.length,
    perFolder,
  };
};

// Quota Supabase Free tier — 1 GB de storage.
// Si tu passes en Pro, mettre à jour cette constante.
export const STORAGE_QUOTA_BYTES = 1 * 1024 * 1024 * 1024;

export const formatBytes = (n: number, decimals = 1): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(decimals)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(decimals + 1)} GB`;
};
