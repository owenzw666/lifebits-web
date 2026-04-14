import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Note } from "../types/note";
import { createRoot } from "react-dom/client";
import NotePopup from "./NotePopup";

type Props = {
  notes: Note[];
  removeNote: (id: number) => Promise<void>;
  editNote: (note: Note) => Promise<void>;
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
  onMapClick: (lat: number, lng: number) => void;
  selectedLocation: { lat: number; lng: number } | null;
};

const MapView = ({
  notes,
  removeNote,
  editNote,
  mapRef,
  onMapClick,
  selectedLocation,
}: Props) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const tempMarkerRef = useRef<maplibregl.Marker | null>(null);
  const isClickOnMarkerRef = useRef(false);

  // 🧱 初始化地图
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current!,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [174.7762, -41.2865],
      zoom: 12,
    });
  }, [mapRef]);

  // 🧱 创建 marker（封装）
  const createMarker = (note: Note) => {
    const container = document.createElement("div");

    const root = createRoot(container);

    root.render(
      <NotePopup note={note} onEdit={editNote} onDelete={removeNote} />,
    );

    const popup = new maplibregl.Popup({ offset: 25 }).setDOMContent(container);

    const el = document.createElement("div");

    el.style.width = "24px";
    el.style.height = "24px";
    el.style.backgroundColor = "#007bff";
    el.style.borderRadius = "50%";
    el.style.border = "3px solid white";

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([note.longitude, note.latitude])
      .setPopup(popup)
      .addTo(mapRef.current!);

    // 👇 关键：监听 marker DOM
    marker.getElement().addEventListener("click", () => {
      isClickOnMarkerRef.current = true;
    });
    return marker;
  };

  // 🧠 根据 notes 更新 marker
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    notes.forEach((note) => {
      const marker = createMarker(note);
      markersRef.current.push(marker);
    });
  }, [notes]);

  // 🎯 点击地图创建 note
  useEffect(() => {
    if (!mapRef.current) return;

    const handleClick = async (e: maplibregl.MapMouseEvent) => {
      if (isClickOnMarkerRef.current) {
        isClickOnMarkerRef.current = false;
        return;
      }
      onMapClick(e.lngLat.lat, e.lngLat.lng);
    };

    mapRef.current.on("click", handleClick);

    return () => {
      mapRef.current?.off("click", handleClick);
    };
  }, [onMapClick]);

  useEffect(() => {
    if (!mapRef.current) return;

    // ❌ 先清除旧的
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }

    // ❌ 如果没有选点 → 不显示
    if (!selectedLocation) return;

    // ✅ 创建临时 marker
    const el = document.createElement("div");

    el.style.width = "20px";
    el.style.height = "20px";
    el.style.backgroundColor = "red";
    el.style.borderRadius = "50%";
    el.style.border = "2px solid white";
    el.style.boxShadow = "0 0 6px rgba(0,0,0,0.5)";

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([selectedLocation.lng, selectedLocation.lat])
      .addTo(mapRef.current);

    tempMarkerRef.current = marker;
  }, [selectedLocation]);

  return <div ref={mapContainerRef} style={{ flex: 1, height: "100vh" }} />;
};

export default MapView;
