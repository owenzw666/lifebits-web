import { useState } from "react";
import type { Note } from "../types/note";

type Props = {
  note: Note;
  onEdit: (note: Note) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

const NotePopup = ({ note, onEdit, onDelete }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  return (
    <div style={{ minWidth: 200 }}>
      {!isEditing ? (
        <>
          <h3>{note.title}</h3>
          <p>{note.content}</p>

          <button onClick={() => setIsEditing(true)}>Edit</button>
          <button
            onClick={async () => {
              if (!confirm("Delete this note?")) return;
              await onDelete(note.id);
            }}
          >
            Delete
          </button>
        </>
      ) : (
        <>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button
            onClick={async () => {
              await onEdit({
                ...note,
                title,
                content,
              });
              setIsEditing(false);
            }}
          >
            Save
          </button>

          <button onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </>
      )}
    </div>
  );
};

export default NotePopup;