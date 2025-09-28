"use client";

import React, { useState } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { NoteCreateData } from '@/lib/firebase/notes';

interface NoteExampleProps {
  userId: string;
}

export default function NoteExample({ userId }: NoteExampleProps) {
  const { notes, loading, error, createNote, updateNote, deleteNote } = useNotes({ userId });
  const [newNote, setNewNote] = useState<NoteCreateData>({
    userId,
    title: '',
    content: '',
    tags: [],
    category: 'general',
    priority: 'medium'
  });

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNote(newNote);
      setNewNote({
        userId,
        title: '',
        content: '',
        tags: [],
        category: 'general',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleUpdateNote = async (noteId: string, updates: any) => {
    try {
      await updateNote(noteId, updates);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading notes...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notes Example</h1>
      
      {/* Create Note Form */}
      <form onSubmit={handleCreateNote} className="mb-8 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Create New Note</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Content</label>
          <textarea
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            className="w-full p-2 border rounded h-32"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={newNote.category}
            onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="general">General</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="ideas">Ideas</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Priority</label>
          <select
            value={newNote.priority}
            onChange={(e) => setNewNote({ ...newNote, priority: e.target.value as any })}
            className="w-full p-2 border rounded"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Create Note
        </button>
      </form>

      {/* Notes List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Notes ({notes.length})</h2>
        
        {notes.length === 0 ? (
          <p className="text-gray-500">No notes yet. Create your first note above!</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">{note.title}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateNote(note.id!, { isPinned: !note.isPinned })}
                    className={`px-2 py-1 text-xs rounded ${
                      note.isPinned ? 'bg-yellow-200' : 'bg-gray-200'
                    }`}
                  >
                    {note.isPinned ? 'Pinned' : 'Pin'}
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id!)}
                    className="px-2 py-1 text-xs bg-red-200 rounded hover:bg-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <p className="text-gray-700 mb-2">{note.content}</p>
              
              <div className="flex gap-2 text-sm text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">{note.category}</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{note.priority}</span>
                {note.tags && note.tags.length > 0 && (
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {note.tags.join(', ')}
                  </span>
                )}
              </div>
              
              <div className="text-xs text-gray-400 mt-2">
                Created: {note.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                {note.metadata && (
                  <span className="ml-4">
                    {note.metadata.wordCount} words, {note.metadata.characterCount} characters
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

