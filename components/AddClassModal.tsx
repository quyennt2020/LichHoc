import React, { useState, useEffect } from 'react';
import { ClassEvent, Subject, DayOfWeek } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { Modal } from './Modal';
import { StarIcon, TrashIcon } from './icons';

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<ClassEvent, 'id'> | ClassEvent) => void;
  onDelete: (eventId: string) => void;
  subjects: Subject[];
  eventToEdit?: ClassEvent | null;
}

const AddClassModal: React.FC<AddClassModalProps> = ({ isOpen, onClose, onSave, onDelete, subjects, eventToEdit }) => {
  const [subjectId, setSubjectId] = useState('');
  const [day, setDay] = useState<DayOfWeek>('Monday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [room, setRoom] = useState('');
  const [teacher, setTeacher] = useState('');
  const [notes, setNotes] = useState('');
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      setSubjectId(eventToEdit.subjectId);
      setDay(eventToEdit.day);
      setStartTime(eventToEdit.startTime);
      setEndTime(eventToEdit.endTime);
      setRoom(eventToEdit.room || '');
      setTeacher(eventToEdit.teacher || '');
      setNotes(eventToEdit.notes || '');
      setHighlighted(eventToEdit.highlighted || false);
    } else {
      // Reset form
      setSubjectId(subjects[0]?.id || '');
      setDay('Monday');
      setStartTime('08:00');
      setEndTime('09:00');
      setRoom('');
      setTeacher('');
      setNotes('');
      setHighlighted(false);
    }
  }, [eventToEdit, isOpen, subjects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
        alert("Please select a subject.");
        return;
    }

    const eventData = {
      subjectId,
      day,
      startTime,
      endTime,
      room,
      teacher,
      notes,
      highlighted
    };

    if (eventToEdit) {
      onSave({ ...eventData, id: eventToEdit.id });
    } else {
      onSave(eventData);
    }
    onClose();
  };
  
  const handleDelete = () => {
    if (eventToEdit && onDelete) {
        // The parent component (App.tsx) will handle the confirmation dialog.
        onDelete(eventToEdit.id);
    }
  };

  const InputField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        {children}
    </div>
  );
  
  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={eventToEdit ? 'Edit Class' : 'Add Class'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField label="Subject">
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={inputClasses} required>
            <option value="" disabled>Select a subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </InputField>

        <InputField label="Day of Week">
          <select value={day} onChange={(e) => setDay(e.target.value as DayOfWeek)} className={inputClasses}>
            {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </InputField>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Start Time">
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClasses} />
          </InputField>
          <InputField label="End Time">
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClasses} />
          </InputField>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <InputField label="Room (Optional)">
                <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} className={inputClasses} />
            </InputField>
            <InputField label="Teacher (Optional)">
                <input type="text" value={teacher} onChange={(e) => setTeacher(e.target.value)} className={inputClasses} />
            </InputField>
        </div>

        <InputField label="Notes (Optional)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClasses}></textarea>
        </InputField>

        <div className="flex justify-between items-center pt-4">
          <div className="flex items-center gap-4">
            {eventToEdit && onDelete && (
                <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                    <TrashIcon className="w-5 h-5"/>
                </button>
            )}
            <button type="button" onClick={() => setHighlighted(!highlighted)} className={`flex items-center gap-1 p-2 rounded-md transition-colors ${highlighted ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50' : 'text-slate-500 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>
                <StarIcon className="w-5 h-5" solid={highlighted} />
                <span className="text-sm font-medium">{highlighted ? 'Highlighted' : 'Highlight'}</span>
            </button>
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

export default AddClassModal;