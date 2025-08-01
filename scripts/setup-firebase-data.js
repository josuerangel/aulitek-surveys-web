// Firebase Data Setup Script
// Run this in your browser console on the Firebase Console page

// Sample survey data
const surveyData = {
  id: "5OvCk9Gnbg6O6QiF7VUm",
  userId: "user123",
  title: "Customer Feedback Survey",
  description: "Help us improve our services by providing your feedback",
  groupId: "group123",
  startDate: "2024-01-01T00:00:00.000Z",
  endDate: "2024-12-31T23:59:59.000Z",
  isActive: true,
  status: "published",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
};

// Sample questions data
const questionsData = {
  questions: [
    {
      id: "1",
      type: "text",
      question: "What is your name?",
      required: true
    },
    {
      id: "2",
      type: "multipleChoice",
      question: "How would you rate our service?",
      required: true,
      options: ["Excellent", "Good", "Average", "Poor"]
    },
    {
      id: "3",
      type: "rating",
      question: "Rate your overall experience (1-5)",
      required: true,
      maxRating: 5
    },
    {
      id: "4",
      type: "comment",
      question: "Any additional comments?",
      required: false
    }
  ]
};

console.log('Survey Data:', surveyData);
console.log('Questions Data:', questionsData);

// Instructions:
// 1. Go to Firebase Console → Firestore Database → Data
// 2. Create a collection called "surveys"
// 3. Add a document with ID: "5OvCk9Gnbg6O6QiF7VUm"
// 4. Add all the fields from surveyData above
// 5. In that document, create a subcollection called "questions"
// 6. Add a document with ID: "questions"
// 7. Add a field called "questions" with the array from questionsData.questions

console.log('Setup Instructions:');
console.log('1. Create collection: surveys');
console.log('2. Add document with ID: 5OvCk9Gnbg6O6QiF7VUm');
console.log('3. Add survey fields from surveyData');
console.log('4. Create subcollection: questions');
console.log('5. Add document with ID: questions');
console.log('6. Add field "questions" with the questions array'); 