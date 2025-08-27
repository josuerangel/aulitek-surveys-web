import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import LoginPage from './components/LoginPage'
import SurveyPage from './components/SurveyPage'
import LoadingSpinner from './components/LoadingSpinner'
import './App.css'

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Survey Route Component to handle survey ID preservation
const SurveyRoute = ({ user, db, setPendingSurveyId }: { user: User | null; db: Firestore; setPendingSurveyId: (id: string | null) => void }) => {
  const { surveyId } = useParams();
  
  if (user) {
    return <SurveyPage user={user} db={db} />;
  } else {
    // Store the survey ID globally and redirect to login
    setPendingSurveyId(surveyId || null);
    return <Navigate to="/login" replace />;
  }
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingSurveyId, setPendingSurveyId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <Routes>
        <Route 
          path="/survey/:surveyId" 
          element={<SurveyRoute user={user} db={db} setPendingSurveyId={setPendingSurveyId} />}
        />
        <Route 
          path="/login" 
          element={
            user ? (
              pendingSurveyId ? (
                <Navigate to={`/survey/${pendingSurveyId}`} replace />
              ) : (
                <Navigate to="/survey/default" replace />
              )
            ) : (
              <LoginPage pendingSurveyId={pendingSurveyId} setPendingSurveyId={setPendingSurveyId} />
            )
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to="/login" replace />} 
        />
      </Routes>
    </div>
  );
}

export default App; 