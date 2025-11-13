import { DayOfWeek, Subject, ClassEvent, HomeTask } from './types';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TIME_SLOTS: string[] = Array.from({ length: 15 }, (_, i) => `${i + 7}:00`);

export const INITIAL_SUBJECTS: Subject[] = [
  { id: '1', name: 'Mathematics', color: 'bg-rose-50 text-rose-800 border-l-4 border-rose-400 dark:bg-rose-900 dark:text-rose-200 dark:border-rose-500' },
  { id: '2', name: 'Physics', color: 'bg-sky-50 text-sky-800 border-l-4 border-sky-400 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-500' },
  { id: '3', name: 'Chemistry', color: 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-400 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-500' },
  { id: '4', name: 'Biology', color: 'bg-amber-50 text-amber-800 border-l-4 border-amber-400 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-500' },
  { id: '5', name: 'History', color: 'bg-violet-50 text-violet-800 border-l-4 border-violet-400 dark:bg-violet-900 dark:text-violet-200 dark:border-violet-500' },
  { id: '6', name: 'Literature', color: 'bg-fuchsia-50 text-fuchsia-800 border-l-4 border-fuchsia-400 dark:bg-fuchsia-900 dark:text-fuchsia-200 dark:border-fuchsia-500' },
  { id: '7', name: 'Extra English', color: 'bg-indigo-50 text-indigo-800 border-l-4 border-indigo-400 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-500' },
];

export const INITIAL_CLASS_EVENTS: ClassEvent[] = [
  { id: 'ce1', subjectId: '1', day: 'Monday', startTime: '08:00', endTime: '09:30', room: 'A101', teacher: 'Mr. Smith' },
  { id: 'ce2', subjectId: '2', day: 'Monday', startTime: '10:00', endTime: '11:30', room: 'B203', teacher: 'Ms. Jones' },
  { id: 'ce3', subjectId: '3', day: 'Tuesday', startTime: '09:00', endTime: '10:30', room: 'C305' },
  { id: 'ce4', subjectId: '6', day: 'Wednesday', startTime: '13:00', endTime: '15:00', room: 'D102', teacher: 'Mrs. Davis' },
  { id: 'ce5', subjectId: '5', day: 'Thursday', startTime: '11:00', endTime: '12:30', room: 'A102' },
  { id: 'ce6', subjectId: '7', day: 'Saturday', startTime: '09:00', endTime: '11:00', room: 'English Center' },
  { id: 'ce7', subjectId: '1', day: 'Friday', startTime: '14:00', endTime: '15:30', room: 'A101', teacher: 'Mr. Smith', highlighted: true },
];

export const INITIAL_HOME_TASKS: HomeTask[] = [
  { id: 'ht1', title: 'Algebra Homework Chapter 3', subjectId: '1', dueDate: '2024-07-28', estimatedTime: 60, priority: 'High', completed: false, content: 'Complete exercises 1-20 on page 54.' },
  { id: 'ht2', title: 'Lab Report: Newton\'s Laws', subjectId: '2', dueDate: '2024-07-29', estimatedTime: 90, priority: 'High', completed: true, content: 'Write up the experiment results and conclusion.' },
  { id: 'ht3', title: 'Read "The Great Gatsby"', subjectId: '6', dueDate: '2024-08-05', estimatedTime: 45, priority: 'Medium', completed: false, content: 'Read chapters 1-3 and take notes.' },
  { id: 'ht4', title: 'Study for Chemistry Quiz', subjectId: '3', dueDate: '2024-07-27', estimatedTime: 120, priority: 'Medium', completed: false, content: 'Review periodic table and chemical bonds.' },
];