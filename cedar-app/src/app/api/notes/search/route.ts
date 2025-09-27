import { NextRequest, NextResponse } from 'next/server';
import { searchNotes } from '@/lib/firebase/notes';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const query = searchParams.get('q');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Search notes
    const notes = await searchNotes(username, query);

    return NextResponse.json({
      success: true,
      notes,
      count: notes.length,
      query
    });
  } catch (error: any) {
    console.error('Error searching notes:', error);
    
    if (error.message.includes('Permission denied')) {
      return NextResponse.json(
        { error: 'Permission denied. Please check your authentication and Firestore rules.' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to search notes', details: error.message },
      { status: 500 }
    );
  }
}
