// Base model interface with common fields
export interface BaseModel {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Group model
export interface Group extends BaseModel {
  userId: string;
  name: string;
  description?: string;
}

// Student model
export interface Student extends BaseModel {
  userId: string;
  firstName: string;
  lastName: string;
  groupId: string;
  birthDate?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
}

// Survey model
export interface Survey extends BaseModel {
  userId: string;
  title: string;
  description?: string;
  groupId: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  status?: 'draft' | 'published' | 'closed';
}

// Survey question types
export type QuestionType = 'text' | 'multipleChoice' | 'choice' | 'yesNo' | 'boolean' | 'rating' | 'comment' | 'date';

// Survey question model
export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  question: string;
  required: boolean;
  options?: string[]; // For multiple choice questions
  maxRating?: number; // For rating questions
  minDate?: string; // For date questions
  maxDate?: string; // For date questions
}

// Survey response model
export interface SurveyResponse extends BaseModel {
  userId: string;
  surveyId: string;
  studentId: string;
  answers: Answer[];
  submittedAt: string; // ISO string
}

// Survey answer model
export interface SurveyAnswer {
  questionId: string;
  answer: string | number | boolean;
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'choice' | 'boolean' | 'date';
  options?: string[];
  required: boolean;
  minDate?: string; // For date questions
  maxDate?: string; // For date questions
}

export interface Answer {
  questionId: string;
  value: string | number | boolean | string[];
}

export interface UserProfile {
  id: string; // UID
  email: string;
  displayName?: string;
  registerDate: string;
  membership: 'free' | 'premium' | 'admin';
} 