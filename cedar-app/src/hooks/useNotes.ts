import { useState, useEffect, useCallback } from 'react';
import { Note, NoteCreateData, NoteUpdateData } from '@/lib/firebase/notes';

interface UseNotesOptions {
  username: string;
  autoFetch?: boolean;
  category?: string;
  tags?: string[];
  isArchived?: boolean;
  limit?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'title';
  orderDirection?: 'asc' | 'desc';
}

interface UseNotesReturn {
  notes: Note[];
  loading: boolean;
  error: string | null;
  createNote: (noteData: NoteCreateData) => Promise<Note>;
  updateNote: (noteId: string, updateData: NoteUpdateData) => Promise<Note>;
  deleteNote: (noteId: string) => Promise<void>;
  getNote: (noteId: string) => Promise<Note | null>;
  searchNotes: (query: string) => Promise<Note[]>;
  refreshNotes: () => Promise<void>;
}

export function useNotes(options: UseNotesOptions): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!options.username) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        username: options.username,
        ...(options.category && { category: options.category }),
        ...(options.tags && { tags: options.tags.join(',') }),
        ...(options.isArchived !== undefined && { isArchived: options.isArchived.toString() }),
        ...(options.limit && { limit: options.limit.toString() }),
        ...(options.orderBy && { orderBy: options.orderBy }),
        ...(options.orderDirection && { orderDirection: options.orderDirection })
      });

      const response = await fetch(`/api/notes?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notes');
      }

      setNotes(data.notes);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const createNote = useCallback(async (noteData: NoteCreateData): Promise<Note> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create note');
      }

      // Add the new note to the local state
      setNotes(prevNotes => [data.note, ...prevNotes]);

      return data.note;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateNote = useCallback(async (noteId: string, updateData: NoteUpdateData): Promise<Note> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}?username=${options.username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update note');
      }

      // Update the note in local state
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === noteId ? data.note : note
        )
      );

      return data.note;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [options.username]);

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}?username=${options.username}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete note');
      }

      // Remove the note from local state
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [options.username]);

  const getNote = useCallback(async (noteId: string): Promise<Note | null> => {
    try {
      const response = await fetch(`/api/notes/${noteId}?username=${options.username}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(data.error || 'Failed to get note');
      }

      return data.note;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [options.username]);

  const searchNotes = useCallback(async (query: string): Promise<Note[]> => {
    if (!query.trim()) return [];

    try {
      const response = await fetch(`/api/notes/search?username=${options.username}&q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search notes');
      }

      return data.notes;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [options.username]);

  const refreshNotes = useCallback(async () => {
    await fetchNotes();
  }, [fetchNotes]);

  // Auto-fetch notes when component mounts or options change
  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchNotes();
    }
  }, [fetchNotes, options.autoFetch]);

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    getNote,
    searchNotes,
    refreshNotes,
  };
}
