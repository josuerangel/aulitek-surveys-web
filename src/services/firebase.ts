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
      // Save only to survey-specific subcollection for better organization and access control
      const surveyResponsesRef = collection(this.db, 'surveys', response.surveyId, 'responses');
      const docRef = await addDoc(surveyResponsesRef, response);
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving survey response:', error);
      throw error;
    }
  }

  // Check if user has already responded to this survey
  async hasUserResponded(surveyId: string, userId: string): Promise<boolean> {
    try {
      const responsesCollectionRef = collection(this.db, 'surveys', surveyId, 'responses');
      const q = query(
        responsesCollectionRef,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking user response:', error);
      return false;
    }
  }

  // Get all responses for a survey (for survey creator)
  async getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
    try {
      const responsesCollectionRef = collection(this.db, 'surveys', surveyId, 'responses');
      const querySnapshot = await getDocs(responsesCollectionRef);
      
      const responses: SurveyResponse[] = [];
      querySnapshot.forEach((doc) => {
        const responseData = doc.data() as SurveyResponse;
        responses.push({ ...responseData, id: doc.id });
      });
      
      return responses.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching survey responses:', error);
      throw error;
    }
  }

  // Check if user is the creator of a survey
  async isSurveyCreator(surveyId: string, userId: string): Promise<boolean> {
    try {
      const survey = await this.getSurvey(surveyId);
      return survey?.userId === userId;
    } catch (error) {
      console.error('Error checking survey creator:', error);
      return false;
    }
  }

  // Get response statistics for a survey
  async getSurveyStats(surveyId: string): Promise<{
    totalResponses: number;
    averageCompletionTime?: number;
    questionStats: Record<string, any>;
  }> {
    try {
      const responses = await this.getSurveyResponses(surveyId);
      
      const stats = {
        totalResponses: responses.length,
        questionStats: {} as Record<string, any>
      };

      // Calculate question statistics
      responses.forEach(response => {
        response.answers.forEach(answer => {
          if (!stats.questionStats[answer.questionId]) {
            stats.questionStats[answer.questionId] = {
              responses: 0,
              values: []
            };
          }
          stats.questionStats[answer.questionId].responses++;
          stats.questionStats[answer.questionId].values.push(answer.value);
        });
      });

      return stats;
    } catch (error) {
      console.error('Error calculating survey stats:', error);
      throw error;
    }
  }

  // Get all surveys created by a user
  async getUserSurveys(userId: string): Promise<Survey[]> {
    try {
      const surveysCollectionRef = collection(this.db, 'surveys');
      const q = query(
        surveysCollectionRef,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const surveys: Survey[] = [];
      
      querySnapshot.forEach((doc) => {
        const surveyData = doc.data() as Survey;
        surveys.push({ ...surveyData, id: doc.id });
      });
      
      return surveys.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching user surveys:', error);
      throw error;
    }
  }

  // Get aggregated analytics for a user's surveys
  async getUserAnalytics(userId: string): Promise<{
    totalSurveys: number;
    totalResponses: number;
    averageResponsesPerSurvey: number;
    surveys: Array<{
      id: string;
      title: string;
      responseCount: number;
    }>;
  }> {
    try {
      const userSurveys = await this.getUserSurveys(userId);
      let totalResponses = 0;
      const surveysWithCounts = [];

      for (const survey of userSurveys) {
        const responses = await this.getSurveyResponses(survey.id);
        totalResponses += responses.length;
        surveysWithCounts.push({
          id: survey.id,
          title: survey.title,
          responseCount: responses.length
        });
      }

      return {
        totalSurveys: userSurveys.length,
        totalResponses,
        averageResponsesPerSurvey: userSurveys.length > 0 ? totalResponses / userSurveys.length : 0,
        surveys: surveysWithCounts
      };
    } catch (error) {
      console.error('Error calculating user analytics:', error);
      throw error;
    }
  }
} 