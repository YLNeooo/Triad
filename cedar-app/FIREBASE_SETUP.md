# Firebase Firestore Setup Guide

## Enable Firestore API

To fix the Firestore permission error, you need to enable the Firestore API in your Firebase project:

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `triad-19f41`

### Step 2: Enable Firestore Database
1. In the left sidebar, click on "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

### Step 3: Configure Security Rules (Optional)
For development, you can use these basic rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 4: Test the Connection
Once Firestore is enabled, your calendar should work properly and start tracking user engagement data.

## Alternative: Use Local Storage (Fallback)

If you prefer not to set up Firestore right now, the calendar will fall back to sample data for demonstration purposes.

## Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=triad-19f41.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=triad-19f41
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=triad-19f41.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=504175831853
NEXT_PUBLIC_FIREBASE_APP_ID=1:504175831853:web:575bf55e4467ce3173c1a4
```

## Data Structure

The app will create a `userEngagement` collection with documents like:

```json
{
  "userId": "user123",
  "inputType": "user-input",
  "engagementType": "dual-agent",
  "timestamp": "2024-01-01T00:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```
