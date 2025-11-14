import React, { useState } from 'react';
import { PlusIcon, HomeIcon, CalendarDaysIcon, BookOpenIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from './icons';

interface FABProps {
  onAddClass: () => void;
  onAddHomeTask: () => void;
  onManageSubjects: () => void;
  onExportData: () => void;
  onImportData: () => void;
}

// ActionItem sub-component to encapsulate a single button's logic and animation.
// This improves readability and separation of concerns.
const ActionItem: React.FC<{
  action: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    className: string;
  };
  isOpen: boolean;
  index: number;
  totalItems: number;
}> = ({ action, isOpen, index, totalItems }) => {
  // Opening animation: Staggered from bottom-up.
  // The item closest to the FAB (last in the array, highest index) gets the shortest delay.
  const openDelay = (totalItems - 1 - index) * 50; // Increased delay for a more noticeable stagger
  
  // Closing animation: Staggered from top-down.
  // The item furthest from the FAB (first in the array, lowest index) gets the shortest delay.
  const closeDelay = index * 40;

  const actionButtonClasses = "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-200 hover:scale-110 active:scale-100";

  return (
    <div
      className={`flex items-center justify-end gap-4 transition-all duration-300 ease-out ${
        isOpen
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-5 pointer-events-none' // Increased translation for a more visible slide
      }`}
      style={{ transitionDelay: `${isOpen ? openDelay : closeDelay}ms` }}
    >
      <span className="bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap">
        {action.label}
      </span>
      <button
        onClick={action.onClick}
        className={`${actionButtonClasses} ${action.className}`}
        aria-label={action.label}
        tabIndex={isOpen ? 0 : -1}
      >
        {action.icon}
      </button>
    </div>
  );
};

const FAB: React.FC<FABProps> = ({ onAddClass, onAddHomeTask, onManageSubjects, onExportData, onImportData }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const actions = [
    { label: 'Thêm việc ở nhà', icon: <HomeIcon className="w-6 h-6" />, onClick: onAddHomeTask, className: 'bg-brand-secondary hover:bg-brand-secondary/90' },
    { label: 'Thêm lớp học', icon: <CalendarDaysIcon className="w-6 h-6" />, onClick: onAddClass, className: 'bg-brand-secondary hover:bg-brand-secondary/90' },
    { label: 'Quản lý môn học', icon: <BookOpenIcon className="w-6 h-6" />, onClick: onManageSubjects, className: 'bg-sky-500 hover:bg-sky-600' },
    { label: 'Xuất dữ liệu', icon: <ArrowDownTrayIcon className="w-6 h-6" />, onClick: onExportData, className: 'bg-emerald-500 hover:bg-emerald-600' },
    { label: 'Nhập dữ liệu', icon: <ArrowUpTrayIcon className="w-6 h-6" />, onClick: onImportData, className: 'bg-emerald-500 hover:bg-emerald-600' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="relative flex flex-col items-end gap-4">
        {/* Action Buttons Container */}
        <div className="flex flex-col gap-3">
          {actions.map((action, index) => (
            <ActionItem
              key={action.label}
              action={{
                ...action,
                onClick: () => {
                  action.onClick();
                  setIsOpen(false);
                },
              }}
              isOpen={isOpen}
              index={index}
              totalItems={actions.length}
            />
          ))}
        </div>
        
        {/* Main FAB button */}
        <button
          onClick={toggleMenu}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform duration-300 ease-in-out bg-brand-primary hover:bg-brand-primary/90 active:scale-95 ${isOpen ? 'rotate-45' : ''}`}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close actions menu' : 'Open actions menu'}
        >
          <PlusIcon className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};

export default FAB;
