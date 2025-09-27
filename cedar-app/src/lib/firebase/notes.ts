import { db } from './client';
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, setDoc } from 'firebase/firestore';

export interface Note {
  id?: string;
  title: string;
  content: string;
  tags?: string[];
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  isPinned?: boolean;
  isArchived?: boolean;
  username: string;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
  metadata?: {
    wordCount?: number;
    characterCount?: number;
    lastModified?: any;
  };
}

export interface NoteCreateData {
  title: string;
  content: string;
  tags?: string[];
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  isPinned?: boolean;
  isArchived?: boolean;
  username: string;
  metadata?: {
    wordCount?: number;
    characterCount?: number;
  };
}

export interface NoteUpdateData {
  title?: string;
  content?: string;
  tags?: string[];
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  isPinned?: boolean;
  isArchived?: boolean;
  metadata?: {
    wordCount?: number;
    characterCount?: number;
  };
}

/**
 * Store a new note in Firestore
 * @param noteData - The note data to store
 * @returns Promise with the created note ID and data
 */
export async function createNote(noteData: NoteCreateData): Promise<{ id: string; data: Note }> {
  try {
    // Validate required fields
    if (!noteData.username) {
      throw new Error('Username is required');
    }
    if (!noteData.title || !noteData.content) {
      throw new Error('Title and content are required');
    }

    // Calculate metadata
    const wordCount = noteData.content.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = noteData.content.length;

    // Prepare the note data for Firestore
    const noteToStore: Omit<Note, 'id'> = {
      title: noteData.title.trim(),
      content: noteData.content.trim(),
      tags: noteData.tags || [],
      category: noteData.category || 'general',
      priority: noteData.priority || 'medium',
      isPinned: noteData.isPinned || false,
      isArchived: noteData.isArchived || false,
      username: noteData.username,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      metadata: {
        wordCount,
        characterCount,
        lastModified: serverTimestamp(),
        ...noteData.metadata
      }
    };

    // Get or create user document and add note to notes array
    const userRef = doc(db, 'users', noteData.username);
    const userDoc = await getDoc(userRef);
    
    let notesArray = [];
    if (userDoc.exists()) {
      notesArray = userDoc.data().notes || [];
    }
    
    // Add new note to array
    const newNoteWithId = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
      ...noteToStore
    };
    notesArray.push(newNoteWithId);
    
    // Update user document with new notes array
    if (userDoc.exists()) {
      await updateDoc(userRef, { notes: notesArray });
    } else {
      await setDoc(userRef, { 
        username: noteData.username,
        notes: notesArray,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // Return the created note with ID
    const createdNote: Note = {
      id: newNoteWithId.id,
      ...noteToStore
    };

    return {
      id: newNoteWithId.id,
      data: createdNote
    };
  } catch (error: any) {
    console.error('Error creating note:', error);
    
    // Handle specific Firestore errors
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your authentication and Firestore rules.');
    } else if (error.code === 'unavailable') {
      throw new Error('Firestore is currently unavailable. Please try again later.');
    } else if (error.code === 'invalid-argument') {
      throw new Error('Invalid data provided. Please check your note content.');
    }
    
    // Re-throw with a user-friendly message
    throw new Error(`Failed to create note: ${error.message}`);
  }
}

/**
 * Update an existing note in Firestore
 * @param noteId - The ID of the note to update
 * @param updateData - The data to update
 * @param username - The username (collection name) where the note is stored
 * @returns Promise with the updated note data
 */
export async function updateNote(noteId: string, updateData: NoteUpdateData, username: string): Promise<Note> {
  try {
    if (!noteId) {
      throw new Error('Note ID is required');
    }
    if (!username) {
      throw new Error('Username is required');
    }

    // Calculate metadata if content is being updated
    let metadata = updateData.metadata;
    if (updateData.content) {
      const wordCount = updateData.content.split(/\s+/).filter(word => word.length > 0).length;
      const characterCount = updateData.content.length;
      metadata = {
        wordCount,
        characterCount,
        ...updateData.metadata
      };
    }

    // Prepare update data
    const updateFields: any = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    if (metadata) {
      updateFields.metadata = metadata;
    }

    // Remove undefined values
    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] === undefined) {
        delete updateFields[key];
      }
    });

    // Get user document and update note in notes array
    const userRef = doc(db, 'users', username);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const notesArray = userData.notes || [];
    
    // Find and update the note in the array
    const noteIndex = notesArray.findIndex((note: any) => note.id === noteId);
    if (noteIndex === -1) {
      throw new Error('Note not found');
    }
    
    // Update the note in the array
    notesArray[noteIndex] = {
      ...notesArray[noteIndex],
      ...updateFields,
      updatedAt: serverTimestamp()
    };
    
    // Update the user document with the modified notes array
    await updateDoc(userRef, { notes: notesArray });
    
    return notesArray[noteIndex] as Note;
  } catch (error: any) {
    console.error('Error updating note:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your authentication and Firestore rules.');
    } else if (error.code === 'not-found') {
      throw new Error('Note not found.');
    }
    
    throw new Error(`Failed to update note: ${error.message}`);
  }
}

/**
 * Delete a note from Firestore
 * @param noteId - The ID of the note to delete
 * @param username - The username (collection name) where the note is stored
 * @returns Promise that resolves when the note is deleted
 */
export async function deleteNote(noteId: string, username: string): Promise<void> {
  try {
    if (!noteId) {
      throw new Error('Note ID is required');
    }
    if (!username) {
      throw new Error('Username is required');
    }

    // Get user document and remove note from notes array
    const userRef = doc(db, 'users', username);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const notesArray = userData.notes || [];
    
    // Find and remove the note from the array
    const noteIndex = notesArray.findIndex((note: any) => note.id === noteId);
    if (noteIndex === -1) {
      throw new Error('Note not found');
    }
    
    // Remove the note from the array
    notesArray.splice(noteIndex, 1);
    
    // Update the user document with the modified notes array
    await updateDoc(userRef, { notes: notesArray });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your authentication and Firestore rules.');
    } else if (error.code === 'not-found') {
      throw new Error('Note not found.');
    }
    
    throw new Error(`Failed to delete note: ${error.message}`);
  }
}

/**
 * Get a single note by ID
 * @param noteId - The ID of the note to retrieve
 * @param username - The username (collection name) where the note is stored
 * @returns Promise with the note data or null if not found
 */
export async function getNote(noteId: string, username: string): Promise<Note | null> {
  try {
    if (!noteId) {
      throw new Error('Note ID is required');
    }
    if (!username) {
      throw new Error('Username is required');
    }

    // Get user document and find note in notes array
    const userRef = doc(db, 'users', username);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    const notesArray = userData.notes || [];
    
    // Find the note in the array
    const note = notesArray.find((note: any) => note.id === noteId);
    
    return note || null;
  } catch (error: any) {
    console.error('Error getting note:', error);
    throw new Error(`Failed to get note: ${error.message}`);
  }
}

/**
 * Get all notes for a user
 * @param userId - The user ID to get notes for
 * @param options - Optional query options
 * @returns Promise with array of notes
 */
export async function getUserNotes(
  username: string, 
  options: {
    limit?: number;
    orderBy?: 'createdAt' | 'updatedAt' | 'title';
    orderDirection?: 'asc' | 'desc';
    category?: string;
    tags?: string[];
    isArchived?: boolean;
  } = {}
): Promise<Note[]> {
  try {
    if (!username) {
      throw new Error('Username is required');
    }

    // Get user document and extract notes array
    const userRef = doc(db, 'users', username);
    const userDoc = await getDoc(userRef);
    
    let notes: Note[] = [];
    if (userDoc.exists()) {
      const userData = userDoc.data();
      notes = userData.notes || [];
    }

    // Apply all filters and sorting client-side to avoid index requirements
    if (options.category) {
      notes = notes.filter(note => note.category === options.category);
    }
    
    if (options.tags && options.tags.length > 0) {
      notes = notes.filter(note => 
        note.tags && note.tags.some(tag => options.tags!.includes(tag))
      );
    }
    
    if (options.isArchived !== undefined) {
      notes = notes.filter(note => note.isArchived === options.isArchived);
    }

    // Apply sorting client-side
    const orderField = options.orderBy || 'updatedAt';
    const orderDir = options.orderDirection || 'desc';
    notes.sort((a, b) => {
      let aValue, bValue;
      
      if (orderField === 'createdAt') {
        aValue = a.createdAt?.toDate?.() || new Date(0);
        bValue = b.createdAt?.toDate?.() || new Date(0);
      } else if (orderField === 'updatedAt') {
        aValue = a.updatedAt?.toDate?.() || new Date(0);
        bValue = b.updatedAt?.toDate?.() || new Date(0);
      } else if (orderField === 'title') {
        aValue = a.title || '';
        bValue = b.title || '';
      } else {
        aValue = a.updatedAt?.toDate?.() || new Date(0);
        bValue = b.updatedAt?.toDate?.() || new Date(0);
      }
      
      if (orderField === 'title') {
        return orderDir === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return orderDir === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
    });

    // Apply limit after filtering and sorting
    if (options.limit) {
      notes = notes.slice(0, options.limit);
    }

    return notes;
  } catch (error: any) {
    console.error('Error getting user notes:', error);
    throw new Error(`Failed to get user notes: ${error.message}`);
  }
}

/**
 * Search notes by content or title
 * @param userId - The user ID to search notes for
 * @param searchTerm - The term to search for
 * @returns Promise with array of matching notes
 */
export async function searchNotes(username: string, searchTerm: string): Promise<Note[]> {
  try {
    if (!username) {
      throw new Error('Username is required');
    }
    if (!searchTerm.trim()) {
      return [];
    }

    // Get all user notes and filter client-side
    // Note: Firestore doesn't support full-text search natively
    const allNotes = await getUserNotes(username);
    
    const searchLower = searchTerm.toLowerCase();
    const matchingNotes = allNotes.filter(note => 
      note.title.toLowerCase().includes(searchLower) ||
      note.content.toLowerCase().includes(searchLower) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );

    return matchingNotes;
  } catch (error: any) {
    console.error('Error searching notes:', error);
    throw new Error(`Failed to search notes: ${error.message}`);
  }
}

/**
 * Helper function to validate note data before storing
 * @param noteData - The note data to validate
 * @returns Object with validation result and errors
 */
export function validateNoteData(noteData: Partial<NoteCreateData>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!noteData.username) {
    errors.push('Username is required');
  }

  if (!noteData.title || noteData.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (noteData.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (!noteData.content || noteData.content.trim().length === 0) {
    errors.push('Content is required');
  } else if (noteData.content.length > 10000) {
    errors.push('Content must be less than 10,000 characters');
  }

  if (noteData.tags && noteData.tags.length > 10) {
    errors.push('Maximum 10 tags allowed');
  }

  if (noteData.priority && !['low', 'medium', 'high'].includes(noteData.priority)) {
    errors.push('Priority must be low, medium, or high');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
