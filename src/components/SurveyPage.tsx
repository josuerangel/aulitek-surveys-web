import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { User } from 'firebase/auth';
import { Survey, SurveyQuestion, SurveyResponse, Answer } from '../../models/types';

interface SurveyPageProps {
  user: User;
}

const SurveyPage = ({ user }: SurveyPageProps) => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // TODO: Fetch survey data from Firebase
    // For now, using mock data
    const mockSurvey: Survey = {
      id: surveyId || 'default',
      userId: 'mock-user',
      title: 'Sample Survey',
      description: 'This is a sample survey for testing purposes',
      groupId: 'mock-group',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      status: 'published'
    };

    const mockQuestions: SurveyQuestion[] = [
      {
        id: '1',
        type: 'text',
        question: 'What is your name?',
        required: true
      },
      {
        id: '2',
        type: 'multipleChoice',
        question: 'How would you rate our service?',
        required: true,
        options: ['Excellent', 'Good', 'Average', 'Poor']
      },
      {
        id: '3',
        type: 'rating',
        question: 'Rate your overall experience (1-5)',
        required: true,
        maxRating: 5
      },
      {
        id: '4',
        type: 'comment',
        question: 'Any additional comments?',
        required: false
      }
    ];

    setSurvey(mockSurvey);
    setQuestions(mockQuestions);
    setLoading(false);
  }, [surveyId]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // TODO: Submit survey response to Firebase
      const response: SurveyResponse = {
        id: `response-${Date.now()}`,
        userId: user.uid,
        surveyId: surveyId || 'default',
        studentId: user.uid, // Using user ID as student ID for now
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value: value
        })),
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Survey response:', response);
      
      // Show success message
      alert('Survey submitted successfully!');
      
      // Sign out and redirect to login
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Error submitting survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderQuestion = (question: SurveyQuestion) => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            required={question.required}
            className="form-input"
          />
        );
      
      case 'multipleChoice':
        return (
          <select
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            required={question.required}
            className="form-select"
          >
            <option value="">Select an option</option>
            {question.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'rating':
        return (
          <div className="rating-container">
            {Array.from({ length: question.maxRating || 5 }, (_, i) => (
              <button
                key={i + 1}
                type="button"
                className={`rating-btn ${answers[question.id] === i + 1 ? 'active' : ''}`}
                onClick={() => handleAnswerChange(question.id, i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        );
      
      case 'comment':
        return (
          <textarea
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            required={question.required}
            className="form-textarea"
            rows={4}
          />
        );
      
      default:
        return <p>Unsupported question type</p>;
    }
  };

  if (loading) {
    return <div className="loading">Loading survey...</div>;
  }

  if (!survey) {
    return <div className="error">Survey not found</div>;
  }

  return (
    <div className="survey-page">
      <div className="survey-header">
        <div className="user-info">
          <span>Welcome, {user.displayName || user.email}</span>
          <button onClick={handleSignOut} className="sign-out-btn">
            Sign Out
          </button>
        </div>
      </div>

      <div className="survey-container">
        <div className="survey-title">
          <h1>{survey.title}</h1>
          {survey.description && <p>{survey.description}</p>}
        </div>

        <form onSubmit={handleSubmit} className="survey-form">
          {questions.map((question, index) => (
            <div key={question.id} className="question-container">
              <label className="question-label">
                {index + 1}. {question.question}
                {question.required && <span className="required">*</span>}
              </label>
              {renderQuestion(question)}
            </div>
          ))}

          <div className="form-actions">
            <button 
              type="submit" 
              disabled={submitting}
              className="submit-btn"
            >
              {submitting ? 'Submitting...' : 'Submit Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyPage; 