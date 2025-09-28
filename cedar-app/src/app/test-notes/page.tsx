"use client";

import React, { useState } from 'react';
import { useAuth } from '@/app/FirebaseAuthProvider';
import { useNotes, NoteCreateData } from '@/hooks/useNotes';
import { TriadBackground } from '@/cedar/components/backgrounds/TriadBackground';
import type { NoteCategory, NotePriority } from "@/lib/firebase/notes";

export default function TestNotesPage() {
  const { user } = useAuth();
  const uid = user?.uid || ""; // gate page on user, so safe here
  const { notes, loading, error, createNote, updateNote, deleteNote, searchNotes } =
  useNotes({ uid });

  const [newNote, setNewNote] = useState<NoteCreateData>({
  uid,
  title: '',
  content: '',
  tags: [],
  category: 'general',
  priority: 'medium',
  isPinned: false,
  isArchived: false,
  metadata: {
    wordCount: 0,
    characterCount: 0,
  },
});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNote({
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags,
        category: newNote.category,
        priority: newNote.priority,
        isPinned: newNote.isPinned,
        isArchived: newNote.isArchived,
        metadata: newNote.metadata,
      });
      setNewNote({
        uid,
        title: '',
        content: '',
        tags: [],
        category: 'general',
        priority: 'medium',
        isPinned: false,
        isArchived: false,
        metadata: { wordCount: 0, characterCount: 0 },
      });
      setTagsInput('');
      alert('Note created successfully!');
    } catch (error: any) {
      alert(`Error creating note: ${error.message}`);
    }
  };

  const handleUpdateNote = async (noteId: string, updates: any) => {
    try {
      await updateNote(noteId, updates);
      alert('Note updated successfully!');
    } catch (error: any) {
      alert(`Error updating note: ${error.message}`);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(noteId);
        alert('Note deleted successfully!');
      } catch (error: any) {
        alert(`Error deleting note: ${error.message}`);
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchNotes(searchQuery);
      setSearchResults(results);
    } catch (error: any) {
      alert(`Error searching notes: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  if (!user) {
    return (
      <TriadBackground className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please Sign In</h1>
          <p className="text-white/80">You need to be signed in to test the notes functionality.</p>
        </div>
      </TriadBackground>
    );
  }

  return (
    <TriadBackground className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Notes & Conversations</h1>
          <div className="bg-white/10 border border-white/20 rounded-lg p-4">
            <p className="text-white">
              Hi, {user.displayName || user.email?.split("@")[0] || "there"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Note Form */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Create New Note</h2>
            
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Title</label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full h-14 px-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                  placeholder="Enter note title..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Content</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full h-32 px-6 py-4 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Enter note content..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Category</label>
                  <select
                    value={newNote.category}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setNewNote(prev => ({ ...prev, category: e.target.value as NoteCategory }))
                    }
                  >
                    <option value="general">General</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="ideas">Ideas</option>
                    <option value="meetings">Meetings</option>
                    <option value="projects">Projects</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Priority</label>
                  <select
                    value={newNote.priority}
                    onChange={(e) => setNewNote({ ...newNote, priority: e.target.value as any })}
                    className="w-full h-14 px-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => {
                    setTagsInput(e.target.value);
                    // Process tags when user types
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                    setNewNote({ ...newNote, tags });
                  }}
                  className="w-full h-14 px-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                  placeholder="important, work, meeting"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newNote.isPinned || false}
                    onChange={(e) => setNewNote({ ...newNote, isPinned: e.target.checked })}
                    className="mr-2 w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-white/50"
                  />
                  <span className="text-sm text-white">Pin this note</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newNote.isArchived || false}
                    onChange={(e) => setNewNote({ ...newNote, isArchived: e.target.checked })}
                    className="mr-2 w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-white/50"
                  />
                  <span className="text-sm text-white">Archive this note</span>
                </label>
              </div>
              
              <button 
                type="submit" 
                className="w-full h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Create Note
              </button>
            </form>
          </div>

          {/* Search Notes */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Search Notes</h2>
            
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-14 px-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                  placeholder="Search notes..."
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="h-14 px-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white font-medium hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-white mb-2">Search Results ({searchResults.length})</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {searchResults.map((note) => (
                      <div key={note.id} className="p-3 bg-white/10 rounded-lg border border-white/20">
                        <h4 className="font-medium text-white">{note.title}</h4>
                        <p className="text-sm text-white/80 truncate">{note.content}</p>
                        <div className="flex space-x-2 mt-1">
                          <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">{note.category}</span>
                          <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">{note.priority}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 mt-8">
          <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-semibold text-white">Your Notes & Conversations ({notes.length})</h2>
            {loading && <span className="text-white/80">Loading...</span>}
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-300">Error: {error}</p>
            </div>
          )}
          
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-white/60 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-white mb-2">No notes yet</h3>
              <p className="text-white/80">Create your first note using the form above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <div key={note.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/20 transition-all duration-200">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-white truncate">{note.title}</h3>
                    <div className="flex space-x-1">
                      {note.isPinned && (
                        <span className="text-yellow-500 text-sm">📌</span>
                      )}
                      {note.isArchived && (
                        <span className="text-gray-500 text-sm">📦</span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-white/80 text-sm mb-4 line-clamp-3">{note.content}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                      {note.category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      note.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                      note.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {note.priority}
                    </span>
                    {note.tags && note.tags.length > 0 && (
                      <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                        {note.tags.slice(0, 2).join(', ')}
                        {note.tags.length > 2 && ` +${note.tags.length - 2}`}
                      </span>
                    )}
                  </div>
                  
                  {note.metadata && (
                    <div className="text-xs text-white/60 mb-3">
                      {note.metadata.wordCount} words • {note.metadata.characterCount} characters
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateNote(note.id!, { isPinned: !note.isPinned })}
                      className={`text-xs px-3 py-1 rounded ${
                        note.isPinned 
                          ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {note.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    
                    <button
                      onClick={() => handleUpdateNote(note.id!, { isArchived: !note.isArchived })}
                      className={`text-xs px-3 py-1 rounded ${
                        note.isArchived 
                          ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {note.isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteNote(note.id!)}
                      className="text-xs px-3 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                  
                  <div className="text-xs text-white/60 mt-2">
                    Created: {note.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TriadBackground>
  );
}
