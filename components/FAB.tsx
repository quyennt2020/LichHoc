
import React, { useState } from 'react';
import { PlusIcon, HomeIcon, CalendarDaysIcon, BookOpenIcon } from './icons';

interface FABProps {
  onAddClass: () => void;
  onAddHomeTask: () => void;
  onManageSubjects: () => void;
}

const FAB: React.FC<FABProps> = ({ onAddClass, onAddHomeTask, onManageSubjects }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const actionButtonClasses = "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform duration-300 ease-in-out";

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="relative flex flex-col items-center gap-3">
        {isOpen && (
          <>
            <div className="flex items-center gap-3">
              <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md">Add Home Task</span>
              <button onClick={() => { onAddHomeTask(); setIsOpen(false); }} className={`${actionButtonClasses} bg-brand-secondary hover:bg-brand-secondary/90`}>
                <HomeIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md">Add Class</span>
              <button onClick={() => { onAddClass(); setIsOpen(false); }} className={`${actionButtonClasses} bg-brand-secondary hover:bg-brand-secondary/90`}>
                <CalendarDaysIcon className="w-6 h-6" />
              </button>
            </div>
             <div className="flex items-center gap-3">
              <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md">Manage Subjects</span>
              <button onClick={() => { onManageSubjects(); setIsOpen(false); }} className={`${actionButtonClasses} bg-brand-secondary hover:bg-brand-secondary/90`}>
                <BookOpenIcon className="w-6 h-6" />
              </button>
            </div>
          </>
        )}
        <button onClick={toggleMenu} className={`${actionButtonClasses} w-16 h-16 bg-brand-primary hover:bg-brand-primary/90 ${isOpen ? 'rotate-45' : ''}`}>
          <PlusIcon className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};

export default FAB;