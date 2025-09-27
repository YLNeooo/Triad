import { NextRequest, NextResponse } from 'next/server';
import { getNote, updateNote, deleteNote, validateNoteData } from '@/lib/firebase/notes';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noteId = params.id;
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const note = await getNote(noteId, username);

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      note
    });
  } catch (error: any) {
    console.error('Error getting note:', error);
    
    if (error.message.includes('Permission denied')) {
      return NextResponse.json(
        { error: 'Permission denied. Please check your authentication and Firestore rules.' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get note', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noteId = params.id;
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const body = await req.json();
    const { title, content, tags, category, priority, isPinned, isArchived } = body;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    // Validate the update data
    const validation = validateNoteData({
      title,
      content,
      tags,
      category,
      priority,
      isPinned,
      isArchived
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    // Update the note
    const updatedNote = await updateNote(noteId, updateData, username);

    return NextResponse.json({
      success: true,
      note: updatedNote
    });
  } catch (error: any) {
    console.error('Error updating note:', error);
    
    if (error.message.includes('Permission denied')) {
      return NextResponse.json(
        { error: 'Permission denied. Please check your authentication and Firestore rules.' },
        { status: 403 }
      );
    } else if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update note', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noteId = params.id;
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    await deleteNote(noteId, username);

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    
    if (error.message.includes('Permission denied')) {
      return NextResponse.json(
        { error: 'Permission denied. Please check your authentication and Firestore rules.' },
        { status: 403 }
      );
    } else if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete note', details: error.message },
      { status: 500 }
    );
  }
}
