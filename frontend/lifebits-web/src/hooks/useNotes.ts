import { useState, useEffect } from "react";
import type { Note } from "../types/note";
import * as noteService from "../services/noteService";

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);

  const loadNotes = async () => {
  const data = await noteService.getNotes();
  setNotes(data);
};

useEffect(() => {
  loadNotes();
}, []);

const addNote = async (note: {
  title: string;
  content: string;
  latitude: number;
  longitude: number;
}) => {
  await noteService.createNote(note);
  await loadNotes();
};

const removeNote = async (id: number) => {
  await noteService.deleteNote(id);
  await loadNotes();
};

const editNote = async (note: Note) => {
  await noteService.updateNote(note);
  await loadNotes();
};

return {
  notes,
  addNote,
  removeNote,
  editNote,
  loadNotes,
};

};



