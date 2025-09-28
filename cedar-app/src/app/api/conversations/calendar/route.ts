import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    // Get the user ID from the request headers or query params
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get notes data from the last year for the specific user
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const userNotesRef = collection(db, 'users', userId, 'notes');
    const notesQuery = query(
      userNotesRef,
      where('createdAt', '>=', oneYearAgo),
      orderBy('createdAt', 'desc')
    );
    
    const notesSnapshot = await getDocs(notesQuery);
    
    const dateMap = new Map<string, number>();
    
    // Count notes by date
    notesSnapshot.docs.forEach(doc => {
      const note = doc.data();
      if (note.createdAt) {
        const noteDate = note.createdAt.toDate();
        // Use local date formatting to avoid timezone issues
        const year = noteDate.getFullYear();
        const month = String(noteDate.getMonth() + 1).padStart(2, '0');
        const day = String(noteDate.getDate()).padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    });

    // Convert to array format
    const calendarData = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count
    }));

    return NextResponse.json(calendarData);
  } catch (error) {
    console.error('Error fetching notes data:', error);
    
    // If Firestore is not enabled, return empty data instead of error
    if (error.message?.includes('PERMISSION_DENIED') || error.message?.includes('API has not been used')) {
      console.log('Firestore not enabled, returning empty data. Please enable Firestore API.');
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch notes data' },
      { status: 500 }
    );
  }
}
