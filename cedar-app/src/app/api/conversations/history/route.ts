import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Query conversations for the user
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('userId', '==', userId),
      orderBy('lastUpdated', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('Error fetching conversation history:', error);
    if (error.message?.includes('PERMISSION_DENIED') || error.message?.includes('API has not been used')) {
      console.log('Firestore not enabled, returning empty data. Please enable Firestore API.');
      return NextResponse.json([]);
    }
    return NextResponse.json(
      { error: 'Failed to fetch conversation history' },
      { status: 500 }
    );
  }
}
