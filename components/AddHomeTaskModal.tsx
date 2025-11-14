import React, { useState, useEffect } from 'react';
import { HomeTask, Subject, DayOfWeek } from '../types';
import { Modal } from './Modal';
import { TrashIcon } from './icons';
import { DAYS_OF_WEEK } from '../constants';

interface AddHomeTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<HomeTask, 'id' | 'completed'> | HomeTask) => void;
  onDelete: (taskId: string) => void;
  subjects: Subject[];
  taskToEdit?: HomeTask | null;
}

// Moved InputField outside the main component to prevent re-creation on render.
const InputField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
  <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      {children}
  </div>
);

const AddHomeTaskModal: React.FC<AddHomeTaskModalProps> = ({ isOpen, onClose, onSave, onDelete, subjects, taskToEdit }) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(60);
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [content, setContent] = useState('');
  const [day, setDay] = useState<DayOfWeek | ''>('');
  const [startTime, setStartTime] = useState('');


  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setSubjectId(taskToEdit.subjectId);
        setDueDate(taskToEdit.dueDate);
        setEstimatedTime(taskToEdit.estimatedTime);
        setPriority(taskToEdit.priority);
        setContent(taskToEdit.content);
        setDay(taskToEdit.day || '');
        setStartTime(taskToEdit.startTime || '');
      } else {
        setTitle('');
        setSubjectId(subjects[0]?.id || '');
        setDueDate(today);
        setEstimatedTime(60);
        setPriority('Medium');
        setContent('');
        setDay('');
        setStartTime('');
      }
    }
  }, [taskToEdit, isOpen, subjects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
        alert("Please select a subject.");
        return;
    }
    const taskData = {
      title, 
      subjectId, 
      dueDate, 
      estimatedTime, 
      priority, 
      content,
      day: day || undefined,
      startTime: day && startTime ? startTime : undefined
    };

    if (taskToEdit) {
      onSave({ ...taskData, id: taskToEdit.id, completed: taskToEdit.completed });
    } else {
      onSave(taskData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (taskToEdit && onDelete) {
      // The parent component (App.tsx) will handle the confirmation dialog.
      onDelete(taskToEdit.id);
    }
  }
  
  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={taskToEdit ? 'Edit Task' : 'Add Home Task'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField label="Task Title">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClasses} required />
        </InputField>
        <InputField label="Related Subject">
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className={inputClasses} required>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
        </InputField>
         <InputField label="Due Date">
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClasses} />
        </InputField>
        <div className="grid grid-cols-2 gap-4">
            <InputField label="Estimated Time (min)">
                <input type="number" value={estimatedTime} onChange={e => setEstimatedTime(Number(e.target.value))} className={inputClasses} />
            </InputField>
            <InputField label="Priority">
                <select value={priority} onChange={e => setPriority(e.target.value as any)} className={inputClasses}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
            </InputField>
        </div>
        <InputField label="Content/Goal">
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} className={inputClasses} required></textarea>
        </InputField>

        <div className="pt-4 mt-4 border-t border-light-border dark:border-dark-border">
            <h4 className="text-md font-semibold text-slate-800 dark:text-slate-200">
                Schedule (Optional)
            </h4>
            <p className="text-xs text-slate-500 mb-2">Assign a specific day and time to this task to add it to your weekly schedule.</p>
            <div className="grid grid-cols-2 gap-4">
                <InputField label="Day">
                    <select value={day} onChange={e => setDay(e.target.value as DayOfWeek | '')} className={inputClasses}>
                        <option value="">Not Scheduled</option>
                        {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </InputField>
                <InputField label="Start Time">
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClasses} disabled={!day} />
                </InputField>
            </div>
        </div>
        
        <div className="flex justify-between items-center pt-4">
            <div>
                {taskToEdit && onDelete && (
                    <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                )}
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-light-text dark:text-dark-text rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 transition-colors">Save</button>
            </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddHomeTaskModal;