import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';

interface PomodoroSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (duration: number) => void;
  currentDuration: number;
}

const PomodoroSettingsModal: React.FC<PomodoroSettingsModalProps> = ({ isOpen, onClose, onSave, currentDuration }) => {
  const [duration, setDuration] = useState(currentDuration);

  useEffect(() => {
    setDuration(currentDuration);
  }, [currentDuration, isOpen]);

  const handleSave = () => {
    if (duration > 0 && duration <= 180) { // Basic validation
      onSave(duration);
      onClose();
    } else {
      alert("Please enter a duration between 1 and 180 minutes.");
    }
  };

  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pomodoro Settings">
      <div className="space-y-4">
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Focus Session Duration (minutes)
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={inputClasses}
            min="1"
            max="180"
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 text-light-text dark:text-dark-text rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 transition-colors">
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PomodoroSettingsModal;