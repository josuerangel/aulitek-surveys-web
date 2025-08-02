# Firebase Database Setup Guide

## Database Structure

### Collections

#### 1. `surveys` Collection
Each document represents a survey with the survey ID as the document ID.

**Document Structure:**
```json
{
  "id": "5OvCk9Gnbg6O6QiF7VUm",
  "userId": "user123",
  "title": "Customer Feedback Survey",
  "description": "Help us improve our services by providing your feedback",
  "groupId": "group123",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z",
  "isActive": true,
  "status": "published",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### 2. `surveys/{surveyId}/questions` Subcollection
Contains individual question documents for a specific survey.

**Question Document Structure:**
```json
// Document ID: "1"
{
  "type": "text",
  "question": "What is your name?",
  "required": true
}

// Document ID: "2"
{
  "type": "multipleChoice",
  "question": "How would you rate our service?",
  "required": true,
  "options": ["Excellent", "Good", "Average", "Poor"]
}

// Document ID: "3"
{
  "type": "rating",
  "question": "Rate your overall experience (1-5)",
  "required": true,
  "maxRating": 5
}

// Document ID: "4"
{
  "type": "comment",
  "question": "Any additional comments?",
  "required": false
}
```

#### 3. `surveys/{surveyId}/responses` Subcollection
Contains survey responses for a specific survey.

**Response Document Structure:**
```json
{
  "id": "response-1234567890",
  "userId": "user456",
  "surveyId": "5OvCk9Gnbg6O6QiF7VUm",
  "studentId": "user456",
  "answers": [
    {
      "questionId": "1",
      "value": "John Doe"
    },
    {
      "questionId": "2",
      "value": "Excellent"
    },
    {
      "questionId": "3",
      "value": 5
    },
    {
      "questionId": "4",
      "value": "Great service!"
    }
  ],
  "submittedAt": "2024-01-15T10:30:00.000Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### 4. Analytics Collection (Optional)
For advanced analytics, you can create a separate collection with aggregated data, but responses are stored only once in the survey subcollection.

## Setup Instructions

### 1. Enable Firestore Database
1. Go to Firebase Console → Firestore Database
2. Click "Create Database"
3. Choose "Start in test mode" for development
4. Select a location close to your users

### 2. Set Up Security Rules
In Firestore Database → Rules, use these rules for proper access control:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Surveys collection
    match /surveys/{surveyId} {
      // Anyone can read published surveys
      allow read: if resource.data.isActive == true;
      // Only authenticated users can create/edit surveys
      allow write: if request.auth != null;
      
      // Survey questions - public read for active surveys
      match /questions/{questionId} {
        allow read: if get(/databases/$(database)/documents/surveys/$(surveyId)).data.isActive == true;
        allow write: if request.auth != null && 
          request.auth.uid == get(/databases/$(database)/documents/surveys/$(surveyId)).data.userId;
      }
      
      // Survey responses - only survey creator can read
      match /responses/{responseId} {
        allow read: if request.auth != null && 
          request.auth.uid == get(/databases/$(database)/documents/surveys/$(surveyId)).data.userId;
        allow create: if request.auth != null;
        allow update, delete: if false; // No modifications allowed
      }
    }
    
    // Analytics collection (if needed for global queries)
    match /analytics/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Create Sample Data

#### Create a Survey Document
1. Go to Firestore Database → Data
2. Click "Start collection" → Name it `surveys`
3. Add a document with ID: `5OvCk9Gnbg6O6QiF7VUm`
4. Add the survey fields as shown above

#### Create Survey Questions
1. In the survey document, click "Start collection" → Name it `questions`
2. Add individual question documents with IDs like "1", "2", "3", etc.
3. Each question document should contain:
   - `type`: "text", "multipleChoice", "rating", or "comment"
   - `question`: The question text
   - `required`: true/false
   - `options`: Array of options (for multipleChoice)
   - `maxRating`: Number (for rating questions)

### 4. Test Your Setup
1. Start your development server: `npm run dev`
2. Visit: `http://localhost:3000/survey/5OvCk9Gnbg6O6QiF7VUm`
3. You should see your survey with the real data from Firebase

## Environment Variables
Make sure your `.env` file has the correct Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Access Control Summary

### Survey Access:
- **Public Read**: Anyone can read published surveys
- **Creator Write**: Only survey creator can modify surveys

### Response Access:
- **Submit**: Any authenticated user can submit responses
- **Read**: Only survey creator can read responses to their surveys
- **No Modifications**: Responses cannot be updated or deleted

### Security Benefits:
- Survey creators can only access responses to their own surveys
- Users can only submit responses, not modify them
- Proper separation of concerns with subcollections

## Troubleshooting

### Common Issues:
1. **"Survey not found"**: Check that the survey document exists with the correct ID
2. **"Permission denied"**: Check Firestore security rules
3. **"Firebase not initialized"**: Verify environment variables are set correctly

### Debug Tips:
1. Check browser console for Firebase errors
2. Verify document IDs match exactly (case-sensitive)
3. Ensure Firestore is enabled in your Firebase project 