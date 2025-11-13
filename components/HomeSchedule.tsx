import React, { useState } from 'react';
import { HomeTask, Subject, DayOfWeek } from '../types';
import { PlayIcon, SparklesIcon, XCircleIcon, ClockIcon } from './icons';
import { DAYS_OF_WEEK } from '../constants';

interface HomeScheduleProps {
  tasks: HomeTask[];
  subjects: Subject[];
  hasSuggestions: boolean;
  onTaskToggle: (taskId: string) => void;
  onTaskClick: (task: HomeTask) => void;
  onStartPomodoro: (task: HomeTask) => void;
  onGenerateSchedule: () => void;
  onClearSuggestions: () => void;
  onMoveTask: (taskId: string, newDay: DayOfWeek | null) => void;
}

const priorityClasses = {
  High: 'bg-red-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-green-500',
};

const TaskCard: React.FC<Omit<HomeScheduleProps, 'tasks' | 'hasSuggestions' | 'onGenerateSchedule' | 'onClearSuggestions' | 'onMoveTask'> & { task: HomeTask }> = 
({ task, subjects, onTaskToggle, onTaskClick, onStartPomodoro }) => {
    const subject = subjects.find(s => s.id === task.subjectId);
    
    const handleDragStart = (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', task.id);
      e.dataTransfer.effectAllowed = 'move';
    };

    return (
         <div
              draggable
              onDragStart={handleDragStart}
              className={`flex items-center p-4 rounded-lg shadow-md transition-all duration-300 bg-light-card dark:bg-dark-card cursor-grab active:cursor-grabbing ${task.completed ? 'opacity-50' : ''}`}
            >
              <div className="flex-shrink-0 mr-4">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => {
                      e.stopPropagation();
                      onTaskToggle(task.id);
                  }}
                  className="h-6 w-6 rounded-full border-gray-300 text-brand-primary focus:ring-brand-primary"
                />
              </div>
              <div className="flex-grow cursor-pointer" onClick={() => onTaskClick(task)}>
                <div className="flex justify-between items-start gap-2">
                  <h3 className={`font-bold text-lg ${task.completed ? 'line-through' : ''} text-light-text dark:text-dark-text`}>
                    {task.title}
                  </h3>
                  <div className={`text-xs font-semibold px-2 py-1 rounded-full ${subject?.color} flex-shrink-0`}>
                    {subject?.name || 'Uncategorized'}
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{task.content}</p>
                <div className="flex flex-wrap items-center text-xs text-slate-500 dark:text-slate-400 mt-2 gap-x-4 gap-y-1">
                  {task.startTime && (
                    <div className="flex items-center">
                        <ClockIcon className="w-3 h-3 mr-1"/>
                        <span>{task.startTime}</span>
                    </div>
                  )}
                  <span>Due: {task.dueDate}</span>
                  <span>Est: {task.estimatedTime} min</span>
                   <div className="flex items-center">
                      <span className={`h-2 w-2 rounded-full mr-1 ${priorityClasses[task.priority]}`}></span>
                      <span>{task.priority}</span>
                    </div>
                </div>
              </div>
               {!task.completed && (
                <div className="flex-shrink-0 ml-4">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onStartPomodoro(task);
                        }}
                        className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors"
                        aria-label={`Start focus session for ${task.title}`}
                    >
                        <PlayIcon className="w-6 h-6" />
                    </button>
                </div>
              )}
            </div>
    );
}


const HomeSchedule: React.FC<HomeScheduleProps> = ({ tasks, subjects, hasSuggestions, onTaskToggle, onTaskClick, onStartPomodoro, onGenerateSchedule, onClearSuggestions, onMoveTask }) => {
  const [dragOverTarget, setDragOverTarget] = useState<DayOfWeek | 'inbox' | null>(null);

  const scheduledTasks = tasks.filter(t => t.day);
  const unscheduledTasks = tasks.filter(t => !t.day).sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);

  const groupedScheduledTasks = scheduledTasks.reduce((acc, task) => {
    if (task.day) {
      if (!acc[task.day]) {
        acc[task.day] = [];
      }
      acc[task.day].push(task);
    }
    return acc;
  }, {} as Record<DayOfWeek, HomeTask[]>);

  for (const day in groupedScheduledTasks) {
    groupedScheduledTasks[day as DayOfWeek].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      return 0;
    });
  }
  
  const cardProps = { subjects, onTaskToggle, onTaskClick, onStartPomodoro };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDrop = (e: React.DragEvent, target: DayOfWeek | null) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    onMoveTask(taskId, target);
    setDragOverTarget(null);
  };

  const getDropZoneClasses = (target: DayOfWeek | 'inbox') => {
    return dragOverTarget === target
      ? 'border-2 border-dashed border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10'
      : 'border-2 border-transparent';
  };

  return (
    <div className="space-y-8 p-2 md:p-4">
       <div className="flex flex-col sm:flex-row justify-center items-center gap-2 p-4 bg-light-card dark:bg-dark-card rounded-lg">
          <div className="text-center">
            <p className="font-semibold text-light-text dark:text-dark-text">AI Study Planner</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Let's create a study plan based on your classes!</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onGenerateSchedule}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/90 transition-colors shadow-md"
            >
              <SparklesIcon className="w-5 h-5"/>
              Generate Plan
            </button>
             {hasSuggestions && (
              <button
                onClick={onClearSuggestions}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-md"
              >
                <XCircleIcon className="w-5 h-5"/>
                Clear Plan
              </button>
            )}
          </div>
      </div>
      
      {/* --- Scheduled Tasks --- */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-light-text dark:text-dark-text border-b pb-2 border-light-border dark:border-dark-border">Scheduled Tasks</h2>
        {tasks.some(t => t.day) ? (
          <div className="space-y-6">
            {DAYS_OF_WEEK.map(day => (
              <div 
                key={day}
                onDragOver={handleDragOver}
                onDragEnter={() => setDragOverTarget(day)}
                onDragLeave={() => setDragOverTarget(null)}
                onDrop={(e) => handleDrop(e, day)}
                className={`p-2 rounded-lg transition-colors ${getDropZoneClasses(day)}`}
              >
                <h3 className="font-semibold text-lg mb-3 text-brand-primary dark:text-brand-secondary">{day}</h3>
                <div className="space-y-3 min-h-[50px]">
                  {groupedScheduledTasks[day]?.map(task => (
                    <TaskCard key={task.id} task={task} {...cardProps} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400 bg-light-card dark:bg-dark-card rounded-lg">
            <p>No tasks scheduled yet.</p>
            <p className="text-sm">Drag tasks from your inbox to a day to schedule them.</p>
          </div>
        )}
      </div>

      {/* --- Unscheduled Tasks (Inbox) --- */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={() => setDragOverTarget('inbox')}
        onDragLeave={() => setDragOverTarget(null)}
        onDrop={(e) => handleDrop(e, null)}
        className={`p-2 rounded-lg transition-colors ${getDropZoneClasses('inbox')}`}
      >
        <h2 className="text-2xl font-bold mb-4 text-light-text dark:text-dark-text border-b pb-2 border-light-border dark:border-dark-border">Inbox (Unscheduled)</h2>
        {unscheduledTasks.length > 0 ? (
          <div className="space-y-3 min-h-[50px]">
            {unscheduledTasks.map(task => (
              <TaskCard key={task.id} task={task} {...cardProps} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-light-card dark:bg-dark-card rounded-lg">
            <p className="text-lg">Your inbox is clear!</p>
            <p>Click the '+' button to add a new task.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeSchedule;