# Aulitek Surveys Web

A React-based web application for collecting survey responses with Google authentication.

## Features

- Google OAuth authentication
- Dynamic survey forms based on survey ID from URL
- Support for multiple question types (text, multiple choice, rating, comment)
- Responsive design
- Firebase integration

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Firebase project with Google authentication enabled

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Google Authentication in the Authentication section
   - Get your Firebase configuration from Project Settings
   - Update the `firebaseConfig` object in `src/App.tsx` with your Firebase credentials

3. **Update Firebase Configuration:**
   Replace the placeholder values in `src/App.tsx`:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will start on `http://localhost:3000`

### Production Build
```bash
npm run build
npm run preview
```

## Usage

1. **Access a Survey:**
   Navigate to `/survey/{surveyId}` where `{surveyId}` is the ID of the survey you want to access.

2. **Authentication:**
   - If not logged in, you'll be redirected to the login page
   - Click "Sign in with Google" to authenticate
   - After successful authentication, you'll be redirected to the survey

3. **Complete Survey:**
   - Fill out the survey questions
   - Click "Submit Survey" when finished
   - You'll be signed out and redirected to the login page

## Project Structure

```
src/
├── components/
│   ├── LoginPage.tsx      # Google authentication page
│   ├── SurveyPage.tsx     # Survey form component
│   └── LoadingSpinner.tsx # Loading indicator
├── models/
│   └── types.ts          # TypeScript type definitions
├── App.tsx               # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Data Models

The application uses the following data models (defined in `models/types.ts`):

- **Survey**: Contains survey metadata
- **SurveyQuestion**: Individual survey questions with different types
- **SurveyResponse**: User responses to surveys
- **Answer**: Individual answers to questions

## Question Types Supported

- **Text**: Single line text input
- **Multiple Choice**: Dropdown selection
- **Rating**: Numeric rating (1-5 scale)
- **Comment**: Multi-line text area

## Environment Variables

For production deployment, consider using environment variables for Firebase configuration:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... etc
```

Then update the Firebase config to use these variables:

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ... etc
};
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC 