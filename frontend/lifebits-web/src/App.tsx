import { useRef, useState } from "react";
import { useNotes } from "./hooks/useNotes";
import MapView from "./components/MapView";
import CreateNoteModal from "./components/CreateNoteModal";

function App() {
  const { notes, addNote, removeNote, editNote } = useNotes();

  const mapRef = useRef<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setIsModalOpen(true);
  };

  const handleCreateNote = async (data: { title: string; content: string }) => {
    if (!selectedLocation) return;

    await addNote({
      ...data,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
    });
    setSelectedLocation(null);
  };


  return (
    <div style={{ display: "flex" }}>
      {/* 左侧列表 */}
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
      <MapView
        notes={notes}
        removeNote={removeNote}
        editNote={editNote}
        mapRef={mapRef}
        onMapClick={handleMapClick}
        selectedLocation={selectedLocation}
      />
      <CreateNoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLocation(null);
        }}
        onSubmit={handleCreateNote}
      />
      
    </div>
  );
}

export default App;
