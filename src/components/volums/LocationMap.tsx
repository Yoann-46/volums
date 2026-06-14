import { useMemo } from "react";
import { MapContainer, TileLayer, Circle, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLang } from "@/i18n/LangContext";

/**
 * Décale légèrement le centre par rapport au point réel (≈130 m, direction
 * déterministe dérivée des coordonnées) — façon Airbnb : la zone est indiquée
 * sans révéler l'adresse exacte, et le décalage ne bouge pas au re-render.
 */
function offsetCenter(lat: number, lng: number): [number, number] {
  const seed = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453);
  const angle = (seed % 1) * 2 * Math.PI;
  const dist = 130; // mètres
  const dLat = (dist * Math.cos(angle)) / 111_000;
  const dLng =
    (dist * Math.sin(angle)) / (111_000 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lng + dLng];
}

// Pin maison noir (disque + icône maison blanche), façon Airbnb.
// divIcon HTML inline → évite le bug d'icônes Leaflet avec les bundlers.
const houseIcon = L.divIcon({
  className: "",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  html: `
    <div style="
      width:44px;height:44px;border-radius:9999px;background:#16171a;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 14px rgba(0,0,0,.35);border:2px solid #fff;">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </div>`,
});

export const LocationMap = ({
  latitude,
  longitude,
  quartier,
  arrondissement,
}: {
  latitude: number;
  longitude: number;
  quartier?: string;
  arrondissement?: string;
}) => {
  const { t } = useLang();
  const center = useMemo(() => offsetCenter(latitude, longitude), [latitude, longitude]);
  const where = [quartier, arrondissement].filter(Boolean).join(" · ");

  return (
    <section className="mt-12 md:mt-16">
      <h2 className="font-display text-2xl md:text-3xl mb-2">
        {t("detail.map.title")}
      </h2>
      {where && (
        <p className="font-mono-meta text-slate text-sm mb-4">{where}</p>
      )}

      <div className="relative overflow-hidden rounded-xl border border-hairline">
        <MapContainer
          center={center}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: "380px", width: "100%" }}
          attributionControl
        >
          {/* Fond CARTO Voyager — coloré et lisible, proche de Google Maps (gratuit) */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {/* Cercle discret = zone approximative (confidentialité) */}
          <Circle
            center={center}
            radius={350}
            pathOptions={{
              color: "hsl(26 53% 51%)",
              fillColor: "hsl(26 53% 51%)",
              fillOpacity: 0.1,
              weight: 1.5,
            }}
          />
          {/* Pin maison noir */}
          <Marker position={center} icon={houseIcon} />
        </MapContainer>
      </div>

      <p className="font-mono-meta text-xs text-slate/70 mt-3">
        {t("detail.map.note")}
      </p>
    </section>
  );
};
