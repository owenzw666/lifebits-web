import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
  }) => Promise<void>;
};

const CreateNoteModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2>Create Note</h2>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />

        <div>
          <button
            onClick={async () => {
              if (!title || !content) return;
              await onSubmit({ title, content });
              setTitle("");
              setContent("");
              onClose();
            }}
          >
            Save
          </button>

          <button onClick={onClose} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNoteModal;

// 简单样式
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  padding: 20,
  borderRadius: 8,
  width: 300,
};