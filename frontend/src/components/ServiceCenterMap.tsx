"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ServiceCenter } from "@/types";

export const BRAND_COLORS: Record<string, string> = {
  Honda: "#D6001C",
  Yamaha: "#0033A0",
  Vespa: "#0E9F8E",
  Kawasaki: "#5BA525",
};

export const INDONESIA_CENTER: [number, number] = [-2.5, 118];

function brandIcon(brand: string, isSelected: boolean) {
  const color = BRAND_COLORS[brand] || "#C1622A";
  const size = isSelected ? 34 : 26;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid #fff;transform:rotate(-45deg);
      box-shadow:0 2px 6px rgba(27,36,48,0.35);
      display:flex;align-items:center;justify-content:center;
      ${isSelected ? "outline:3px solid rgba(193,98,42,0.45);outline-offset:2px;" : ""}
    "><span style="transform:rotate(45deg);color:#fff;font-weight:700;font-size:11px;font-family:sans-serif;">${brand.charAt(0)}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function userIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:18px;height:18px;border-radius:50%;background:#2563EB;
      border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,0.25);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

interface MapControllerProps {
  selected: ServiceCenter | null;
  userLocation: { lat: number; lng: number } | null;
}

function MapController({ selected, userLocation }: MapControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (selected) {
      map.flyTo([selected.latitude, selected.longitude], 13, { duration: 0.8 });
    } else if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 11, { duration: 0.8 });
    }
  }, [map, selected, userLocation]);

  return null;
}

interface ServiceCenterMapProps {
  centers: ServiceCenter[];
  userLocation: { lat: number; lng: number } | null;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function ServiceCenterMap({
  centers,
  userLocation,
  selectedId,
  onSelect,
}: ServiceCenterMapProps) {
  const initialCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : INDONESIA_CENTER;
  const initialZoom = userLocation ? 11 : 5;
  const selected = centers.find((c) => c.id === selectedId) || null;

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom
      className="h-full w-full rounded-xl"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController selected={selected} userLocation={userLocation} />

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon()}>
          <Popup>
            <strong>Lokasi Anda</strong>
          </Popup>
        </Marker>
      )}

      {centers.map((center) => (
        <Marker
          key={center.id}
          position={[center.latitude, center.longitude]}
          icon={brandIcon(center.brand, center.id === selectedId)}
          eventHandlers={{ click: () => onSelect(center.id) }}
        >
          <Popup>
            <div style={{ minWidth: 200, fontFamily: "sans-serif" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
                {center.name}
              </div>
              <div style={{ fontSize: 12, color: "#5A687A", marginBottom: 6 }}>
                {center.type} &middot; {center.brand}
              </div>
              <div style={{ fontSize: 12, marginBottom: 3 }}>{center.address}</div>
              <div style={{ fontSize: 12, color: "#5A687A" }}>
                {center.city}, {center.province}
              </div>
              {typeof center.distance_km === "number" && (
                <div style={{ fontSize: 12, color: "#C1622A", fontWeight: 600, marginTop: 4 }}>
                  {center.distance_km.toFixed(1)} km dari Anda
                </div>
              )}
              {center.phone && (
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  📞 <a href={`tel:${center.phone}`}>{center.phone}</a>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
