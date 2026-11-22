'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix icon default Leaflet di bundler Webpack/Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerProps {
  lat: number;
  lng: number;
  radius: number;
  onChange: (lat: number, lng: number) => void;
}

// Komponen penangkap klik di peta
function MapClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Komponen untuk sinkronisasi posisi kamera ketika koordinat berubah via input
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lng)) {
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
      <div className="w-full h-80 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm animate-pulse">
        Memuat Peta...
      </div>
    );
  }

  const validLat = isNaN(lat) ? 1.4748 : lat;
  const validLng = isNaN(lng) ? 124.8421 : lng;

  return (
    <div className="space-y-2">
      <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-300 relative z-0 shadow-inner">
        <MapContainer
          center={[validLat, validLng]}
          zoom={16}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          />
          <Marker
            position={[validLat, validLng]}
            icon={defaultIcon}
            draggable={true}
            eventHandlers={{
              dragend(e) {
                const marker = e.target;
                const position = marker.getLatLng();
                onChange(position.lat, position.lng);
              },
            }}
          />
          <Circle
            center={[validLat, validLng]}
            radius={radius || 100}
            pathOptions={{
              color: '#0d9488',
              fillColor: '#14b8a6',
              fillOpacity: 0.2,
              weight: 2,
            }}
          />
          <MapClickHandler onChange={onChange} />
          <MapRecenter lat={validLat} lng={validLng} />
        </MapContainer>
      </div>
      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-teal-500"></span>
        <span>
          <strong>Tips:</strong> Klik di mana saja pada peta atau geser pin marker biru untuk menentukan titik kantor. Lingkaran hijau menunjukkan jangkauan radius geofencing presensi.
        </span>
      </p>
    </div>
  );
}
