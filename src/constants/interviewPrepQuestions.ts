export type InterviewPrepCategory =
  | 'opener'
  | 'behavioural'
  | 'strengths-weaknesses'
  | 'motivation';

export interface InterviewPrepQuestion {
  id: string;        // stable slug, e.g. 'tell-me-about-yourself'
  question: string;
  category: InterviewPrepCategory;
}

export const INTERVIEW_PREP_QUESTIONS: InterviewPrepQuestion[] = [
  { id: 'tell-me-about-yourself', question: 'Tell me about yourself.', category: 'opener' },
  { id: 'why-leaving', question: 'Why are you leaving your current role?', category: 'motivation' },
  { id: 'what-motivates-you', question: 'What motivates you at work?', category: 'motivation' },
  { id: 'greatest-strength', question: 'What is your greatest strength?', category: 'strengths-weaknesses' },
  { id: 'greatest-weakness', question: 'What is your greatest weakness?', category: 'strengths-weaknesses' },
  { id: 'proudest-achievement', question: 'What is your proudest professional achievement?', category: 'behavioural' },
  { id: 'difficult-situation', question: 'Tell me about a difficult situation at work and how you handled it.', category: 'behavioural' },
  { id: 'conflict-colleague', question: 'Describe a time you had a conflict with a colleague. How did you resolve it?', category: 'behavioural' },
  { id: 'leadership-example', question: 'Give an example of a time you led a project or initiative.', category: 'behavioural' },
  { id: 'failure-learning', question: 'Tell me about a time you failed. What did you learn?', category: 'behavioural' },
  { id: 'learning-example', question: 'Tell me about a time you had to learn a new skill quickly.', category: 'behavioural' },
  { id: 'five-year-plan', question: 'Where do you see yourself in five years?', category: 'motivation' },
];
