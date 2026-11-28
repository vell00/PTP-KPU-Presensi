'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Self-contained SVG pin marker (no external CDN dependency)
const kpuPinIcon = L.divIcon({
  className: 'kpu-map-pin',
  html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2C9.925 2 5 6.925 5 13C5 20.75 16 30 16 30C16 30 27 20.75 27 13C27 6.925 22.075 2 16 2Z" fill="#D52832" stroke="#07142F" stroke-width="2"/>
      <circle cx="16" cy="13" r="4.5" fill="#FFFFFF"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 30],
});

interface LocationPickerProps {
  lat: number;
  lng: number;
  radius: number;
  onChange: (lat: number, lng: number) => void;
}

function MapClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({ lat, lng, radius, onChange }: LocationPickerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-80 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 text-sm animate-pulse">
        Memuat Peta Geofencing...
      </div>
    );
  }

  const validLat = Number.isNaN(lat) ? 1.4748 : lat;
  const validLng = Number.isNaN(lng) ? 124.8421 : lng;

  return (
    <div className="space-y-2">
      <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-200 relative z-0">
        <MapContainer
          center={[validLat, validLng]}
          zoom={16}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <Marker
            position={[validLat, validLng]}
            icon={kpuPinIcon}
            draggable={true}
            eventHandlers={{
              dragend(e) {
                const position = e.target.getLatLng();
                onChange(position.lat, position.lng);
              },
            }}
          />
          <Circle
            center={[validLat, validLng]}
            radius={radius || 100}
            pathOptions={{
              color: '#D52832',
              fillColor: '#D52832',
              fillOpacity: 0.16,
              weight: 2,
            }}
          />
          <MapClickHandler onChange={onChange} />
          <MapRecenter lat={validLat} lng={validLng} />
        </MapContainer>
      </div>
      <p className="text-xs text-slate-500 flex items-center gap-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#D52832] shrink-0" />
        <span>
          Klik di peta atau seret pin merah untuk mengatur titik pusat kantor. Lingkaran menunjukkan
          radius toleransi presensi WFO.
        </span>
      </p>
    </div>
  );
}
