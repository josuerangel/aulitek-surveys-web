import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
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

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
          element={
            user ? <SurveyPage user={user} db={db} /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/survey/:surveyId" replace /> : <LoginPage />
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