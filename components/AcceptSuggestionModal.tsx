import React, { useState, useEffect } from 'react';
import { HomeTask, Subject, DayOfWeek, SuggestedTaskSlot } from '../types';
import { Modal } from './Modal';
import { DAYS_OF_WEEK } from '../constants';

interface AcceptSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (task: Omit<HomeTask, 'id' | 'completed'>) => void;
  subjects: Subject[];
  suggestion: SuggestedTaskSlot | null;
}

const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const InputField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
  <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      {children}
  </div>
);

const AcceptSuggestionModal: React.FC<AcceptSuggestionModalProps> = ({ isOpen, onClose, onAccept, subjects, suggestion }) => {
  const [title, setTitle] = useState('');
  const [day, setDay] = useState<DayOfWeek>('Monday');
  const [startTime, setStartTime] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(60);
  const [content, setContent] = useState('');
  const [subjectName, setSubjectName] = useState('');

  useEffect(() => {
    if (isOpen && suggestion) {
      const subject = subjects.find(s => s.id === suggestion.task.subjectId);
      setTitle(suggestion.task.title);
      setSubjectName(subject?.name || 'Unknown Subject');
      setDay(suggestion.day);
      setStartTime(suggestion.startTime);
      const duration = timeToMinutes(suggestion.endTime) - timeToMinutes(suggestion.startTime);
      setEstimatedTime(duration > 0 ? duration : 30);
      setContent(suggestion.task.content);
    }
  }, [suggestion, isOpen, subjects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion) return;

    const taskData = {
      title, 
      subjectId: suggestion.task.subjectId,
      dueDate: suggestion.task.dueDate,
      estimatedTime, 
      priority: suggestion.task.priority, 
      content,
      day: day,
      startTime: startTime,
    };

    onAccept(taskData);
  };
  
  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm";
  const readOnlyClasses = `${inputClasses} bg-gray-100 dark:bg-slate-800 cursor-not-allowed`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review & Schedule Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField label="Task Title">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClasses} required />
        </InputField>
        <InputField label="Related Subject">
            <input type="text" value={subjectName} readOnly className={readOnlyClasses} />
        </InputField>
        <InputField label="Day">
            <select value={day} onChange={e => setDay(e.target.value as DayOfWeek)} className={inputClasses}>
                {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
        </InputField>
        <div className="grid grid-cols-2 gap-4">
             <InputField label="Start Time">
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClasses} />
            </InputField>
            <InputField label="Duration (minutes)">
                <input type="number" value={estimatedTime} onChange={e => setEstimatedTime(Number(e.target.value))} className={inputClasses} step="5" min="5" />
            </InputField>
        </div>
        <InputField label="Content/Goal">
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} className={inputClasses}></textarea>
        </InputField>
        
        <div className="flex justify-end items-center pt-4 gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-light-text dark:text-dark-text rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 transition-colors">Accept & Schedule</button>
        </div>
      </form>
    </Modal>
  );
};

export default AcceptSuggestionModal;
