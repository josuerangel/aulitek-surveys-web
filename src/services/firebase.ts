import { Firestore, doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Survey, SurveyQuestion, SurveyResponse } from '../../models/types';

export class FirebaseService {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  // Fetch survey by ID
  async getSurvey(surveyId: string): Promise<Survey | null> {
    try {
      const surveyDocRef = doc(this.db, 'surveys', surveyId);
      const surveyDoc = await getDoc(surveyDocRef);

      if (!surveyDoc.exists()) {
        return null;
      }

      const surveyData = surveyDoc.data() as Survey;
      console.log('Survey data fetched:', surveyData);
      return { ...surveyData, id: surveyDoc.id };
    } catch (error) {
      console.error('Error fetching survey:', error);
      throw error;
    }
  }

  // Fetch survey questions
  async getSurveyQuestions(surveyId: string): Promise<SurveyQuestion[]> {
    try {
      console.log('Fetching questions for survey:', surveyId);
      
      // Fetch questions as individual documents in subcollection
      const questionsCollectionRef = collection(this.db, 'surveys', surveyId, 'questions');
      const questionsSnapshot = await getDocs(questionsCollectionRef);
      
      if (!questionsSnapshot.empty) {
        const questions: SurveyQuestion[] = [];
        questionsSnapshot.forEach((doc) => {
          const questionData = doc.data();
          console.log('Question document:', doc.id, questionData);
          
          // Map the question data to our SurveyQuestion interface
          const question: SurveyQuestion = {
            id: doc.id,
            type: questionData.type || questionData.questionType || 'text',
            question: questionData.question || questionData.text || questionData.questionText,
            required: questionData.required || false,
            options: questionData.options || questionData.choices,
            maxRating: questionData.maxRating || questionData.ratingMax
          };
          
          questions.push(question);
        });
        
        // Sort questions by order if available, otherwise by ID
        const sortedQuestions = questions.sort((a, b) => {
          const orderA = parseInt(a.id) || 0;
          const orderB = parseInt(b.id) || 0;
          return orderA - orderB;
        });
        
        console.log('Found questions as individual documents:', sortedQuestions);
        return sortedQuestions;
      }

      console.log('No questions found in subcollection');
      return [];
    } catch (error) {
      console.error('Error fetching survey questions:', error);
      throw error;
    }
  }

  // Save survey response
  async saveSurveyResponse(response: SurveyResponse): Promise<string> {
    try {
      const responsesCollectionRef = collection(this.db, 'surveyResponses');
      const docRef = await addDoc(responsesCollectionRef, response);
      return docRef.id;
    } catch (error) {
      console.error('Error saving survey response:', error);
      throw error;
    }
  }

  // Check if user has already responded to this survey
  async hasUserResponded(surveyId: string, userId: string): Promise<boolean> {
    try {
      const responsesCollectionRef = collection(this.db, 'surveyResponses');
      const q = query(
        responsesCollectionRef,
        where('surveyId', '==', surveyId),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking user response:', error);
      return false;
    }
  }
} 