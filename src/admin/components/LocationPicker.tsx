import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";

// Capte les clics sur la carte pour repositionner le point.
const ClickHandler = ({ onPick }: { onPick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Recentre la carte quand le point change (après un géocodage).
const Recenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 15));
  }, [lat, lng, map]);
  return null;
};

export const LocationPicker = ({
  address,
  latitude,
  longitude,
  onAddressChange,
  onPick,
}: {
  address: string;
  latitude: number | null;
  longitude: number | null;
  onAddressChange: (v: string) => void;
  onPick: (lat: number, lng: number) => void;
}) => {
  const [geocoding, setGeocoding] = useState(false);

  const geocode = async () => {
    if (!address.trim()) {
      toast.error("Saisis une adresse à géocoder");
      return;
    }
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          address,
        )}`,
        { headers: { Accept: "application/json" } },
      );
      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (!data.length) {
        toast.error("Adresse introuvable. Précise-la (rue, ville).");
        return;
      }
      const { lat, lon } = data[0];
      onPick(parseFloat(lat), parseFloat(lon));
      toast.success("Position trouvée — ajuste-la au clic si besoin");
    } catch {
      toast.error("Échec du géocodage. Réessaie.");
    } finally {
      setGeocoding(false);
    }
  };

  const hasPoint = latitude != null && longitude != null;
  const center: [number, number] = hasPoint
    ? [latitude as number, longitude as number]
    : [48.8566, 2.3522]; // Paris par défaut

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="block font-mono-meta text-xs text-slate mb-1">
          Adresse (référence interne — non affichée publiquement)
        </span>
        <div className="flex gap-2">
          <input
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                geocode();
              }
            }}
            placeholder="Ex : 12 rue de la Pompe, 75116 Paris"
            className="flex-1 border border-hairline bg-cream-soft px-3 py-2 focus:outline-none focus:border-ink"
          />
          <button
            type="button"
            onClick={geocode}
            disabled={geocoding}
            className="shrink-0 bg-ink text-cream px-4 h-[42px] font-mono-meta text-sm hover:bg-copper transition-colors disabled:opacity-50"
          >
            {geocoding ? "Recherche…" : "Géocoder"}
          </button>
        </div>
      </label>

      <div className="relative overflow-hidden rounded-md border border-hairline">
        <MapContainer
          center={center}
          zoom={hasPoint ? 15 : 11}
          style={{ height: "320px", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
            attribution='&copy; OpenStreetMap &copy; CARTO'
          />
          <ClickHandler onPick={onPick} />
          {hasPoint && (
            <>
              <Recenter lat={latitude as number} lng={longitude as number} />
              {/* Cercle = aperçu de la zone publique (~350 m) */}
              <Circle
                center={center}
                radius={350}
                pathOptions={{
                  color: "hsl(26 53% 51%)",
                  fillColor: "hsl(26 53% 51%)",
                  fillOpacity: 0.15,
                  weight: 1,
                }}
              />
              {/* Point exact (visible admin uniquement) */}
              <CircleMarker
                center={center}
                radius={7}
                pathOptions={{ color: "#111", fillColor: "#111", fillOpacity: 1 }}
              />
            </>
          )}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between font-mono-meta text-xs text-slate">
        <span>
          {hasPoint
            ? `Position : ${(latitude as number).toFixed(5)}, ${(longitude as number).toFixed(5)}`
            : "Aucune position — géocode une adresse ou clique sur la carte."}
        </span>
        {hasPoint && (
          <button
            type="button"
            onClick={() => onPick(NaN, NaN)}
            className="text-copper hover:text-ink"
          >
            Effacer
          </button>
        )}
      </div>
      <p className="font-mono-meta text-xs text-slate/60">
        Clique sur la carte pour placer ou ajuster le point. Le site public n'affiche
        qu'un cercle approximatif (~300 m), jamais le point exact.
      </p>
    </div>
  );
};
