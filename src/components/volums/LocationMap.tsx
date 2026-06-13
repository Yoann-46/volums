import { MapContainer, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLang } from "@/i18n/LangContext";

/**
 * Décale légèrement le centre du cercle par rapport au point réel (≈130 m,
 * direction déterministe dérivée des coordonnées) — façon Airbnb : la zone est
 * indiquée sans révéler l'adresse exacte, et le décalage ne bouge pas au re-render.
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
  const center = offsetCenter(latitude, longitude);
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
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <Circle
            center={center}
            radius={350}
            pathOptions={{
              color: "hsl(26 53% 51%)",
              fillColor: "hsl(26 53% 51%)",
              fillOpacity: 0.18,
              weight: 2,
            }}
          />
        </MapContainer>
      </div>

      <p className="font-mono-meta text-xs text-slate/70 mt-3">
        {t("detail.map.note")}
      </p>
    </section>
  );
};
