import { Firestore, doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Survey, SurveyQuestion, SurveyResponse, Student } from '../../models/types';

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
            maxRating: questionData.maxRating || questionData.ratingMax,
            createdAt: questionData.createdAt || new Date().toISOString(),
            updatedAt: questionData.updatedAt || new Date().toISOString()
          };
          
          questions.push(question);
        });
        
        // Sort questions by creation date (first created goes at the top)
        const sortedQuestions = questions.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateA - dateB; // Ascending order: oldest first (top)
        });
        
        console.log('Questions sorted by creation date (oldest first):');
        sortedQuestions.forEach((q, index) => {
          console.log(`  ${index + 1}. "${q.question}" (created: ${q.createdAt})`);
        });
        
        return sortedQuestions;
      }

      console.log('No questions found in subcollection');
      return [];
    } catch (error) {
      console.error('Error fetching survey questions:', error);
      throw error;
    }
  }

  // Save survey response and create student if needed
  async saveSurveyResponse(response: SurveyResponse): Promise<string> {
    try {
      // Get the survey to access groupId
      const survey = await this.getSurvey(response.surveyId);
      if (!survey) {
        throw new Error('Survey not found');
      }

      // Get survey questions to find name questions
      const questions = await this.getSurveyQuestions(response.surveyId);
      
      // Try to create or find student based on name questions
      let studentId = response.studentId;
      const student = await this.createOrFindStudent(response, questions, survey.groupId, survey.userId);
      if (student) {
        studentId = student.id;
      }

      // Update response with the student ID
      const updatedResponse = {
        ...response,
        studentId: studentId
      };

      // Save the response
      const surveyResponsesRef = collection(this.db, 'surveys', response.surveyId, 'responses');
      const docRef = await addDoc(surveyResponsesRef, updatedResponse);
      
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

  // Create or find student based on name questions in survey
  private async createOrFindStudent(
    response: SurveyResponse, 
    questions: SurveyQuestion[], 
    groupId: string,
    surveyCreatorUserId: string
  ): Promise<Student | null> {
    try {
      // Find name-related questions (questions are already sorted by creation date)
      const nameQuestions = questions.filter(q => 
        q.type === 'text' && 
        (q.question.toLowerCase().includes('name') || 
         q.question.toLowerCase().includes('nombre') ||
         q.question.toLowerCase().includes('nombre completo'))
      );

      if (nameQuestions.length === 0) {
        console.log('No name questions found in survey');
        return null;
      }

      // Use the FIRST (earliest created) name question for student creation
      // Since questions are sorted by createdAt, index 0 is the first created
      const firstNameQuestion = nameQuestions[0];
      console.log('Found', nameQuestions.length, 'name questions. Using the FIRST (earliest created):');
      console.log('  - Question:', firstNameQuestion.question);
      console.log('  - Created at:', firstNameQuestion.createdAt);
      console.log('  - Question ID:', firstNameQuestion.id);
      
      // Log all name questions for debugging
      nameQuestions.forEach((q, index) => {
        console.log(`  - Name question ${index + 1}: "${q.question}" (created: ${q.createdAt})`);
      });

      // Extract name from the first name question
      const nameAnswer = response.answers.find(a => a.questionId === firstNameQuestion.id);
      if (!nameAnswer || typeof nameAnswer.value !== 'string') {
        console.log('No name found in first name question response');
        return null;
      }

      const fullName = nameAnswer.value.trim();

      if (!fullName) {
        console.log('No name found in first name question response');
        return null;
      }

      // Parse name into first and last name
      const nameParts = fullName.split(' ').filter(part => part.length > 0);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      console.log('Parsed name for student creation:', { firstName, lastName, fullName });

      // Check if student already exists in this group
      const existingStudent = await this.findStudentByName(firstName, lastName, groupId);
      if (existingStudent) {
        console.log('Student already exists:', existingStudent.id);
        return existingStudent;
      }

      // Create new student
      // Note: userId represents the survey creator (who created the survey)
      // This is different from the survey submitter (who is answering the survey)
      const newStudent: Omit<Student, 'id'> = {
        userId: surveyCreatorUserId, // Survey creator who owns this survey
        firstName: firstName,
        lastName: lastName,
        groupId: groupId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Creating student with:', {
        userId: surveyCreatorUserId,
        firstName,
        lastName,
        groupId,
        note: 'userId is the survey creator who owns this survey',
        surveySubmitter: response.userId,
        note2: 'surveySubmitter is the Google authenticated user who submitted the survey'
      });

      const studentsCollectionRef = collection(this.db, 'students');
      const docRef = await addDoc(studentsCollectionRef, newStudent);
      
      const createdStudent: Student = {
        ...newStudent,
        id: docRef.id
      };

      console.log('Created new student:', createdStudent.id);
      return createdStudent;
    } catch (error) {
      console.error('Error creating/finding student:', error);
      return null;
    }
  }

  // Find student by name in a specific group
  private async findStudentByName(
    firstName: string, 
    lastName: string, 
    groupId: string
  ): Promise<Student | null> {
    try {
      const studentsCollectionRef = collection(this.db, 'students');
      const q = query(
        studentsCollectionRef,
        where('firstName', '==', firstName),
        where('lastName', '==', lastName),
        where('groupId', '==', groupId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const studentData = doc.data() as Student;
        return { ...studentData, id: doc.id };
      }
      
      return null;
    } catch (error) {
      console.error('Error finding student by name:', error);
      return null;
    }
  }

  // Get all students in a group
  async getGroupStudents(groupId: string): Promise<Student[]> {
    try {
      const studentsCollectionRef = collection(this.db, 'students');
      const q = query(
        studentsCollectionRef,
        where('groupId', '==', groupId)
      );
      
      const querySnapshot = await getDocs(q);
      const students: Student[] = [];
      
      querySnapshot.forEach((doc) => {
        const studentData = doc.data() as Student;
        students.push({ ...studentData, id: doc.id });
      });
      
      return students.sort((a, b) => 
        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      );
    } catch (error) {
      console.error('Error fetching group students:', error);
      throw error;
    }
  }
} 