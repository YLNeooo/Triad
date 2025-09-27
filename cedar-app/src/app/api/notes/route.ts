import { NextRequest, NextResponse } from 'next/server';
import { createNote, getUserNotes, validateNoteData } from '@/lib/firebase/notes';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, title, content, tags, category, priority, isPinned, isArchived } = body;

    // Validate the note data
    const validation = validateNoteData({
      username,
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

    // Create the note
    const result = await createNote({
      username,
      title,
      content,
      tags: tags || [],
      category: category || 'general',
      priority: priority || 'medium',
      isPinned: isPinned || false,
      isArchived: isArchived || false
    });

    return NextResponse.json({
      success: true,
      note: result.data,
      id: result.id
    });
  } catch (error: any) {
    console.error('Error creating note:', error);
    
    // Handle specific error cases
    if (error.message.includes('Permission denied')) {
      return NextResponse.json(
        { error: 'Permission denied. Please check your authentication and Firestore rules.' },
        { status: 403 }
      );
    } else if (error.message.includes('unavailable')) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create note', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags');
    const isArchived = searchParams.get('isArchived');
    const limit = searchParams.get('limit');
    const orderBy = searchParams.get('orderBy');
    const orderDirection = searchParams.get('orderDirection');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Parse options
    const options: any = {};
    if (category) options.category = category;
    if (tags) options.tags = tags.split(',');
    if (isArchived !== null) options.isArchived = isArchived === 'true';
    if (limit) options.limit = parseInt(limit);
    if (orderBy) options.orderBy = orderBy;
    if (orderDirection) options.orderDirection = orderDirection;

    // Get user notes
    const notes = await getUserNotes(username, options);

    return NextResponse.json({
      success: true,
      notes,
      count: notes.length
    });
  } catch (error: any) {
    console.error('Error getting notes:', error);
    
    if (error.message.includes('Permission denied')) {
      return NextResponse.json(
        { error: 'Permission denied. Please check your authentication and Firestore rules.' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get notes', details: error.message },
      { status: 500 }
    );
  }
}
