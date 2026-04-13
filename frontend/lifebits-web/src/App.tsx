import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

function App() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersMapRef = useRef<{ [key: number]: maplibregl.Marker }>({});

  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const loadNotes = async () => {
    const res = await fetch("https://localhost:44359/api/notes");
    const data = await res.json();
    setNotes(data);
  };

  const deleteNote = async (id: number) => {
    await fetch(`https://localhost:44359/api/notes/${id}`, {
      method: "DELETE",
    });

    await loadMarkers(); // 刷新地图
    await loadNotes(); // 刷新列表
  };

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    markersMapRef.current = {};
  };

  const loadMarkers = async () => {
    if (!mapRef.current) return;

    const res = await fetch("https://localhost:44359/api/notes");
    const data = await res.json();

    // 👉 清空旧 markers（下一步会讲）
    clearMarkers();

    data.forEach((note: any) => {
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

      marker.setPopup(popup);

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

            await fetch(`https://localhost:xxxx/api/notes/${note.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: note.id,
                title: newTitle,
                content: newContent,
                latitude: note.latitude,
                longitude: note.longitude,
              }),
            });

            popup.remove(); // 关闭 popup
            await loadMarkers();
            await loadNotes();
          });

        // 👉 Delete
        document
          .getElementById(`delete-${note.id}`)
          ?.addEventListener("click", async () => {
            if (!confirm("Delete this note?")) return;

            await deleteNote(note.id);
            popup.remove();
          });
      });

      markersRef.current.push(marker);
      // 👇 保存到 map
      markersMapRef.current[note.id] = marker;
    });
  };

  const handleSubmit = async () => {
    if (!selectedLocation) return;

    const res = await fetch("https://localhost:44359/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        content,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      }),
    });
    /*
    const newNote = await res.json();

    // 👉 创建 marker + popup
    const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
    <h3>${newNote.title}</h3>
    <p>${newNote.content}</p>
  `);
  */

    await loadMarkers();
    await loadNotes();
    // 👉 重置
    setTitle("");
    setContent("");
    setSelectedLocation(null);
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    loadNotes();
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [174.78, -41.28],

      zoom: 12,
    });

    mapRef.current = map;
    // 👉 获取数据函数

    const fetchNotes = async () => {
      const res = await fetch("https://localhost:44359/api/notes");
      const data = await res.json();

      // 👉 遍历创建 marker
      data.forEach((note: any) => {
        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
  <div style="min-width:150px">
    <h3 style="margin:0">${note.title}</h3>
    <p style="margin:5px 0">${note.content}</p>
  </div>
`);

        new maplibregl.Marker()
          .setLngLat([note.longitude, note.latitude])
          .setPopup(popup)
          .addTo(map);
      });
    };

    // 👉 地图加载后执行
    map.on("load", () => {
      loadMarkers();
    });
    map.on("click", (e) => {
      // 👇 判断是否点击的是 marker
      const target = e.originalEvent.target as HTMLElement;
      if (
        target.closest(".maplibregl-marker") ||
        target.closest(".maplibregl-popup")
      ) {
        return;
      }
      const { lng, lat } = e.lngLat;
      setSelectedLocation({ lat, lng });
    });

    return () => map.remove();
  }, []);

  return (
    <>
      <div style={{ display: "flex" }}>
        {/* 左侧列表 */}
        <div
          style={{
            width: "30%",
            padding: "10px",
            background: "#fafafa",
            borderRight: "1px solid #ddd",
            overflowY: "auto",
            height: "100vh",
          }}
        >
          {notes.map((note: any) => (
            <div
              key={note.id}
              style={{
                background: selectedId === note.id ? "#e6f2ff" : "white",
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "8px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
              }}
            >
              <h4 style={{ margin: "0 0 5px 0" }}>
                {note.title || "Untitled"}
              </h4>

              <div
                style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}
              >
                {new Date(note.createdAt).toLocaleString()}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  color: "#555",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  marginBottom: "8px",
                }}
              >
                {note.content}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "none",
                    background: "#007bff",
                    color: "white",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    mapRef.current?.flyTo({
                      center: [note.longitude, note.latitude],
                      zoom: 14,
                    });
                    // 2️⃣ 打开 popup
                    setTimeout(() => {
                      const marker = markersMapRef.current[note.id];
                      marker?.togglePopup();
                    }, 300);

                    // 3️⃣ 高亮选中
                    setSelectedId(note.id);
                  }}
                >
                  Go
                </button>

                <button
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "none",
                    background: "#dc3545",
                    color: "white",
                    cursor: "pointer",
                  }}
                  onClick={() => deleteNote(note.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 右侧地图 */}
        <div style={{ width: "70%", height: "100vh" }} ref={mapContainer}></div>
      </div>

      {selectedLocation && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            background: "white",
            padding: 10,
            borderRadius: 8,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          <h3>Create Note</h3>

          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <br />

          <textarea
            placeholder="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <br />

          <button onClick={handleSubmit}>Save</button>
          <button onClick={() => setSelectedLocation(null)}>Cancel</button>
        </div>
      )}
    </>
  );
}

export default App;
