import type { Note } from "../types/note";

const API_URL = "https://localhost:44359/api/notes";

export const getNotes = async (): Promise<Note[]> => {
  const res = await fetch(API_URL);
  return res.json();
};

export const createNote = async (note: {
  title: string;
  content: string;
  latitude: number;
  longitude: number;
}) => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(note),
  });

  return res.json();
};

export const updateNote = async (note: Note) => {
  await fetch(`${API_URL}/${note.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(note),
  });
};

export const deleteNote = async (id: number) => {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
};