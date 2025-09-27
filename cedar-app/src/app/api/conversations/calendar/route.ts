import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    // Get user engagement data from the last year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const engagementRef = collection(db, 'userEngagement');
    const q = query(
      engagementRef,
      where('timestamp', '>=', oneYearAgo),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const engagements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Group user inputs by date
    const dateMap = new Map<string, number>();
    
    engagements.forEach((engagement: any) => {
      const date = engagement.timestamp.toDate().toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    // Convert to array format
    const calendarData = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count
    }));

    return NextResponse.json(calendarData);
  } catch (error) {
    console.error('Error fetching user engagement data:', error);
    
    // If Firestore is not enabled, return empty data instead of error
    if (error.message?.includes('PERMISSION_DENIED') || error.message?.includes('API has not been used')) {
      console.log('Firestore not enabled, returning empty data. Please enable Firestore API.');
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user engagement data' },
      { status: 500 }
    );
  }
}
