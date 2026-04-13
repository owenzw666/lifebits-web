import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { useNotes } from "./hooks/useNotes";
import type { Note } from "./types/note";

function App() {
  // 🔥 从 hook 获取数据和操作
  const { notes, addNote, removeNote, editNote } = useNotes();

  // 地图引用
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // marker 管理
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const isClickOnMarkerRef = useRef(false);

  // 🧱 初始化地图（只执行一次）
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current!,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [174.7762, -41.2865], // Wellington
      zoom: 12,
    });
  }, []);

  // 🧠 根据 notes 渲染 marker（核心逻辑）
  useEffect(() => {
    if (!mapRef.current) return;

    // 1️⃣ 清除旧 marker
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // 2️⃣ 创建新 marker
    notes.forEach((note: Note) => {
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div id="popup-${note.id}" style="min-width:180px">
    
          <div class="view-mode">
          <h3>${note.title}</h3>
          <p>${note.content}</p>
          <button style="background:#007bff;color:white;border:none;padding:4px 8px;border-radius:4px;" id="edit-${note.id}">Edit</button>
          <button style="background:#dc3545;color:white;border:none;padding:4px 8px;border-radius:4px;" id="delete-${note.id}">Delete</button>
          </div>

          <div class="edit-mode" style="display:none">
          <input id="title-${note.id}" value="${note.title}" />
          <textarea id="content-${note.id}">${note.content}</textarea>
          <button id="save-${note.id}">Save</button>
          <button id="cancel-${note.id}">Cancel</button>
          </div>

        </div>
      `);

      popup.on("open", () => {
        const container = document.getElementById(`popup-${note.id}`);
        if (!container) return;

        const view = container.querySelector(".view-mode") as HTMLElement;
        const edit = container.querySelector(".edit-mode") as HTMLElement;

        // 👉 Edit
        document
          .getElementById(`edit-${note.id}`)
          ?.addEventListener("click", () => {
            view.style.display = "none";
            edit.style.display = "block";
          });

        // 👉 Cancel
        document
          .getElementById(`cancel-${note.id}`)
          ?.addEventListener("click", () => {
            edit.style.display = "none";
            view.style.display = "block";
          });

        // 👉 Save
        document
          .getElementById(`save-${note.id}`)
          ?.addEventListener("click", async () => {
            const newTitle = (
              document.getElementById(`title-${note.id}`) as HTMLInputElement
            ).value;
            const newContent = (
              document.getElementById(
                `content-${note.id}`,
              ) as HTMLTextAreaElement
            ).value;

            note.title = newTitle;
            note.content = newContent;
            await editNote(note);

            popup.remove(); // 关闭 popup
            // await loadMarkers();
            // await loadNotes();
          });

        // 👉 Delete
        document
          .getElementById(`delete-${note.id}`)
          ?.addEventListener("click", async () => {
            if (!confirm("Delete this note?")) return;

            await removeNote(note.id);
            popup.remove();
          });
      });

      const el = document.createElement("div");

      el.style.width = "24px";
      el.style.height = "24px";
      el.style.backgroundColor = "#007bff";
      el.style.borderRadius = "50%";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";

      // 内部小点
      const inner = document.createElement("div");
      inner.style.width = "6px";
      inner.style.height = "6px";
      inner.style.backgroundColor = "white";
      inner.style.borderRadius = "50%";

      el.appendChild(inner);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([note.longitude, note.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);

      // // 👉 popup 事件绑定
      // marker.getPopup().on("open", () => {
      //   const btn = document.getElementById(`delete-${note.id}`);
      //   if (btn) {
      //     btn.onclick = async () => {
      //       if (!confirm("Delete this note?")) return;
      //       await removeNote(note.id);
      //     };
      //   }
      // });

      // 👇 关键：监听 marker DOM
      marker.getElement().addEventListener("click", () => {
        isClickOnMarkerRef.current = true;
      });
      markersRef.current.push(marker);
    });
  }, [notes, editNote, removeNote]);

  // 🎯 创建 note（点击地图）
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const handleClick = async (e: maplibregl.MapMouseEvent) => {
            // ❗ 如果是点击 marker，就跳过
      if (isClickOnMarkerRef.current) {
        isClickOnMarkerRef.current = false; // 重置
        return;
      }
      const title = prompt("Enter title");
      const content = prompt("Enter content");

      if (!title || !content) return;

      await addNote({
        title,
        content,
        latitude: e.lngLat.lat,
        longitude: e.lngLat.lng,
      });
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [addNote]);

  return (
    <div style={{ display: "flex" }}>
      {/* 左侧列表（简化版） */}
      <div style={{ width: "300px", padding: "10px" }}>
        <h2>Notes</h2>
        {notes.map((note) => (
          <div
            key={note.id}
            style={{
              border: "1px solid #ddd",
              padding: "8px",
              marginBottom: "8px",
              cursor: "pointer",
            }}
            onClick={() => {
              mapRef.current?.flyTo({
                center: [note.longitude, note.latitude],
                zoom: 14,
              });
            }}
          >
            <h4>{note.title}</h4>
            <p>{note.content}</p>
          </div>
        ))}
      </div>

      {/* 地图 */}
      <div ref={mapContainerRef} style={{ flex: 1, height: "100vh" }} />
    </div>
  );
}

export default App;
