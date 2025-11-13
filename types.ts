
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export interface ClassEvent {
  id: string;
  subjectId: string;
  day: DayOfWeek;
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
  room?: string;
  teacher?: string;
  notes?: string;
  highlighted?: boolean;
}

export interface HomeTask {
  id: string;
  title: string;
  subjectId: string;
  dueDate: string; // "YYYY-MM-DD" format
  estimatedTime: number; // in minutes
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  content: string;
  day?: DayOfWeek;
  startTime?: string; // "HH:mm" format
}

export type ActiveTab = 'today' | 'class' | 'home';

export type ModalType = 
  | 'addClass' 
  | 'editClass' 
  | 'addHomeTask' 
  | 'editHomeTask' 
  | 'manageSubjects'
  | 'pomodoroSettings'
  | null;

export interface ModalState {
  type: ModalType;
  data?: ClassEvent | HomeTask | null;
}

export interface SuggestedTaskSlot {
  id: string;
  task: HomeTask;
  day: DayOfWeek;
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
}