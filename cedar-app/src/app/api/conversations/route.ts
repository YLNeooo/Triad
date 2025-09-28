import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, inputType, engagementType } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create user engagement record
    const engagementData = {
      userId,
      inputType: inputType || 'user-input',
      engagementType: engagementType || 'dual-agent',
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'userEngagement'), engagementData);

    return NextResponse.json({
      id: docRef.id,
      ...engagementData
    });
  } catch (error) {
    console.error('Error creating user engagement record:', error);
    
    // If Firestore is not enabled, return success but log the issue
    if (error.message?.includes('PERMISSION_DENIED') || error.message?.includes('API has not been used')) {
      console.log('Firestore not enabled, engagement not tracked. Please enable Firestore API.');
      return NextResponse.json({
        id: 'local-' + Date.now(),
        userId: body.userId,
        inputType: body.inputType || 'user-input',
        engagementType: body.engagementType || 'dual-agent',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        note: 'Firestore not enabled - data not persisted'
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to create user engagement record' },
      { status: 500 }
    );
  }
}
