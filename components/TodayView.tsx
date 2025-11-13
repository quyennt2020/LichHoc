import React, { useState, useEffect } from 'react';
import { ClassEvent, HomeTask, Subject } from '../types';

type TodayItem = (ClassEvent & { itemType: 'class' }) | (HomeTask & { itemType: 'task', endTime: string });

interface TodayViewProps {
  classEvents: ClassEvent[];
  homeTasks: HomeTask[];
  subjects: Subject[];
  onClassClick: (event: ClassEvent) => void;
  onTaskClick: (task: HomeTask) => void;
  onTaskToggle: (taskId: string) => void;
}

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const TodayView: React.FC<TodayViewProps> = ({ classEvents, homeTasks, subjects, onClassClick, onTaskClick, onTaskToggle }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getSubject = (subjectId: string) => subjects.find(s => s.id === subjectId);

    const todaysClasses: TodayItem[] = classEvents
        .map(event => ({ ...event, itemType: 'class' }));

    const todaysTasks: TodayItem[] = homeTasks
        .map(task => ({ 
            ...task, 
            itemType: 'task', 
            endTime: minutesToTime(timeToMinutes(task.startTime!) + task.estimatedTime) 
        }));

    const todayItems: TodayItem[] = [...todaysClasses, ...todaysTasks].sort((a, b) => {
        return timeToMinutes(a.startTime!) - timeToMinutes(b.startTime!);
    });

    const hourHeight = 80;
    const timeToPosition = (time: string) => (timeToMinutes(time) - 7 * 60) / 60 * hourHeight;
    const eventDuration = (startTime: string, endTime: string) => (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60 * hourHeight;

    const minutesNow = currentTime.getHours() * 60 + currentTime.getMinutes();
    const showTimeIndicator = minutesNow >= 7 * 60 && minutesNow <= 22 * 60;

    if (todayItems.length === 0) {
        return (
            <div className="text-center p-10 bg-light-card dark:bg-dark-card rounded-lg shadow-md mt-4">
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Nothing scheduled for today!</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Enjoy your day off or get ahead on your inbox tasks.</p>
            </div>
        );
    }

    return (
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md mt-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-light-text dark:text-dark-text">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
            </div>

            <div className="relative grid grid-cols-[auto_1fr] gap-x-2">
                {/* Time labels */}
                <div className="relative -top-3">
                    {Array.from({ length: 16 }, (_, i) => i + 7).map(hour => (
                        <div key={hour} className="relative text-right pr-2 text-sm text-slate-400 dark:text-slate-400" style={{ height: hourHeight }}>
                            <span className="absolute -top-2 right-2">{`${hour}:00`}</span>
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="relative border-l border-slate-200 dark:border-slate-700/50">
                    {Array.from({ length: 15 }, (_, i) => (
                        <div key={i} style={{ height: hourHeight }} className="border-b border-dashed border-slate-200 dark:border-slate-700/50"></div>
                    ))}
                    
                    {showTimeIndicator && (
                        <div className="absolute w-[calc(100%+8px)] -left-1 h-0.5 bg-red-500 z-20" style={{ top: timeToPosition(minutesToTime(minutesNow)) }}>
                            <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                        </div>
                    )}
                    
                    {todayItems.map(item => {
                        const subject = getSubject(item.subjectId);
                        if (!subject) return null;

                        return (
                            <div
                                key={item.id}
                                className={`absolute w-[calc(100%-0.5rem)] ml-2 p-3 rounded-lg shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${subject.color} ${item.itemType === 'task' && item.completed ? 'opacity-50' : ''}`}
                                style={{
                                    top: timeToPosition(item.startTime!),
                                    height: eventDuration(item.startTime!, item.endTime),
                                }}
                                onClick={() => item.itemType === 'class' ? onClassClick(item) : onTaskClick(item)}
                            >
                                <div className="flex h-full">
                                    {item.itemType === 'task' && (
                                        <div className="flex-shrink-0 mr-3 mt-1">
                                            <input
                                                type="checkbox"
                                                checked={item.completed}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    onTaskToggle(item.id);
                                                }}
                                                className="h-5 w-5 rounded-full border-gray-300 text-brand-primary focus:ring-brand-primary"
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-col flex-grow min-w-0">
                                        <strong className={`font-semibold leading-tight truncate ${item.itemType === 'task' && item.completed ? 'line-through' : ''}`}>
                                            {item.itemType === 'class' ? subject.name : item.title}
                                        </strong>
                                        <span className="text-xs opacity-80">
                                            {item.startTime} - {item.endTime}
                                        </span>
                                        {item.itemType === 'class' && item.room && (
                                            <span className="text-xs opacity-70 mt-1 truncate">Room: {item.room}</span>
                                        )}
                                        <div className="mt-auto text-xs opacity-70 font-medium">
                                          {item.itemType === 'task' ? subject.name : item.teacher || ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TodayView;