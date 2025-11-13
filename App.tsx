import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ClassSchedule from './components/ClassSchedule';
import HomeSchedule from './components/HomeSchedule';
import TodayView from './components/TodayView';
import AddClassModal from './components/AddClassModal';
import AddHomeTaskModal from './components/AddHomeTaskModal';
import PomodoroSettingsModal from './components/PomodoroSettingsModal';
import FAB from './components/FAB';
import { Subject, ClassEvent, HomeTask, ActiveTab, ModalState, DayOfWeek, SuggestedTaskSlot } from './types';
import { INITIAL_SUBJECTS, INITIAL_CLASS_EVENTS, INITIAL_HOME_TASKS, DAYS_OF_WEEK } from './constants';
import { StyleInjector } from './components/Modal';
import { PomodoroTimer, PomodoroStyles } from './components/PomodoroTimer';
import { TrashIcon, SunIcon, MoonIcon, BellIcon, ClipboardIcon } from './components/icons';

type Theme = 'light' | 'dark';

const Header: React.FC<{
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  theme: Theme;
  toggleTheme: () => void;
  notificationPermission: NotificationPermission;
  onRequestNotifications: () => void;
}> = ({ activeTab, onTabChange, theme, toggleTheme, notificationPermission, onRequestNotifications }) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState('');

  const getTabClasses = (tab: ActiveTab) => 
    `px-4 py-2 text-lg font-semibold rounded-t-lg transition-colors duration-300 w-1/3 text-center cursor-pointer flex items-center justify-center gap-2 ${
      activeTab === tab 
      ? 'bg-light-card dark:bg-dark-card text-brand-primary dark:text-brand-secondary' 
      : 'text-slate-500 dark:text-slate-400 hover:text-light-text dark:hover:text-dark-text bg-light-bg dark:bg-dark-bg'
    }`;
    
  const handleBellClick = () => {
    if (notificationPermission === 'default') {
      onRequestNotifications();
    } else {
      const text = notificationPermission === 'granted'
        ? 'Notifications are enabled.'
        : 'Notifications are blocked in browser settings.';
      setTooltipText(text);
      setTooltipVisible(true);
      setTimeout(() => setTooltipVisible(false), 3000);
    }
  };

  const bellColorClass = {
    granted: 'text-green-500',
    denied: 'text-red-500',
    default: 'text-slate-500',
  }[notificationPermission];

  return (
    <header className="bg-light-bg dark:bg-dark-bg p-4 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
            <div className="w-10"></div> {/* Spacer to keep title centered */}
            <h1 className="text-3xl font-bold text-brand-primary dark:text-brand-secondary">
              MySchedule
            </h1>
            <div className="flex items-center gap-2">
                <button 
                    onClick={toggleTheme} 
                    className="p-2 rounded-full text-slate-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6 text-yellow-400" />}
                </button>
                 <div className="relative">
                    <button 
                    onClick={handleBellClick} 
                    className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${bellColorClass}`}
                    aria-label="Toggle notifications"
                    >
                    <BellIcon className="w-6 h-6" />
                    {notificationPermission === 'default' && (
                        <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-light-bg dark:ring-dark-bg" />
                    )}
                    </button>
                    {tooltipVisible && (
                    <div className="absolute top-full right-0 mt-2 w-max bg-slate-800 text-white text-xs px-3 py-1.5 rounded-md shadow-lg z-10">
                        {tooltipText}
                    </div>
                    )}
                </div>
            </div>
        </div>
        <div className="w-full max-w-md flex">
          <button onClick={() => onTabChange('today')} className={getTabClasses('today')}><ClipboardIcon className="w-5 h-5"/>Hôm nay</button>
          <button onClick={() => onTabChange('class')} className={getTabClasses('class')}>Lịch Ở Lớp</button>
          <button onClick={() => onTabChange('home')} className={getTabClasses('home')}>Lịch Ở Nhà</button>
        </div>
      </div>
    </header>
  );
};

const SubjectManagerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    subjects: Subject[];
    onUpdate: (subjects: Subject[]) => void;
}> = ({ isOpen, onClose, subjects: initialSubjects, onUpdate }) => {
    const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectColor, setNewSubjectColor] = useState('bg-gray-200 text-gray-800 border-gray-300');
    
    const colorOptions = [
        'bg-red-200 text-red-800 border-red-300', 'bg-blue-200 text-blue-800 border-blue-300',
        'bg-green-200 text-green-800 border-green-300', 'bg-yellow-200 text-yellow-800 border-yellow-300',
        'bg-purple-200 text-purple-800 border-purple-300', 'bg-pink-200 text-pink-800 border-pink-300',
        'bg-indigo-200 text-indigo-800 border-indigo-300', 'bg-teal-200 text-teal-800 border-teal-300'
    ];

    useEffect(() => {
        setSubjects(initialSubjects);
    }, [initialSubjects, isOpen]);

    const handleUpdate = (id: string, name: string) => {
        setSubjects(subjects.map(s => s.id === id ? {...s, name} : s));
    };

    const handleAdd = () => {
        if (newSubjectName.trim()) {
            setSubjects([...subjects, { id: crypto.randomUUID(), name: newSubjectName.trim(), color: newSubjectColor }]);
            setNewSubjectName('');
        }
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this subject? This will also delete all associated classes and tasks.")) {
            setSubjects(current => current.filter(s => s.id !== id));
        }
    };
    
    const handleSave = () => {
        onUpdate(subjects);
        onClose();
    };

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 ${!isOpen && 'hidden'}`} onClick={onClose}>
            <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text rounded-lg shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">Manage Subjects</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {subjects.map(subject => (
                        <div key={subject.id} className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full ${subject.color.split(' ')[0]}`}></span>
                            <input type="text" value={subject.name} onChange={e => handleUpdate(subject.id, e.target.value)} className="flex-grow p-1 rounded bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border" />
                            <button onClick={() => handleDelete(subject.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
                    <h3 className="font-semibold mb-2">Add New Subject</h3>
                    <div className="flex items-center gap-2">
                        <input type="text" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="Subject Name" className="flex-grow p-1 rounded bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border" />
                        <select value={newSubjectColor} onChange={e => setNewSubjectColor(e.target.value)} className="p-1 rounded bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border">
                            {colorOptions.map(c => <option key={c} value={c} className={c.split(' ')[0]}>{c.split(' ')[0].split('-')[1]}</option>)}
                        </select>
                        <button onClick={handleAdd} className="bg-brand-primary text-white px-3 py-1 rounded">Add</button>
                    </div>
                </div>
                 <div className="flex justify-end gap-2 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-slate-600 rounded-md">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-brand-primary text-white rounded-md">Save Changes</button>
                </div>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [classEvents, setClassEvents] = useState<ClassEvent[]>(INITIAL_CLASS_EVENTS);
  const [homeTasks, setHomeTasks] = useState<HomeTask[]>(INITIAL_HOME_TASKS);
  const [modalState, setModalState] = useState<ModalState>({ type: null, data: null });
  const [pomodoroTask, setPomodoroTask] = useState<HomeTask | null>(null);
  const [pomodoroDuration, setPomodoroDuration] = useState<number>(() => {
      const saved = localStorage.getItem('pomodoroDuration');
      return saved ? JSON.parse(saved) : 25;
  });
  const [suggestedSlots, setSuggestedSlots] = useState<SuggestedTaskSlot[]>([]);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
        return localStorage.getItem('theme') as Theme;
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const sentNotificationsRef = useRef(new Set<string>());

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
      setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
      localStorage.setItem('pomodoroDuration', JSON.stringify(pomodoroDuration));
  }, [pomodoroDuration]);

  // --- NOTIFICATION LOGIC ---
  useEffect(() => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return;
    }
    setNotificationPermission(window.Notification.permission);
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
  };

  useEffect(() => {
    if (notificationPermission !== 'granted' || !('Notification' in window)) return;

    const checkNotifications = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
      const sentNotifications = sentNotificationsRef.current;

      // 1. Upcoming scheduled items
      const upcomingItems: (ClassEvent | (HomeTask & {day: DayOfWeek, startTime: string}))[] = [
        ...classEvents,
        ...homeTasks.filter((t): t is HomeTask & {day: DayOfWeek, startTime: string} => !!(t.day && t.startTime && !t.completed))
      ];

      upcomingItems.forEach(item => {
        const itemDayIndex = DAYS_OF_WEEK.indexOf(item.day);
        const todayDayIndex = (now.getDay() + 6) % 7; // Monday is 0

        if (itemDayIndex === todayDayIndex) {
          const [hours, minutes] = item.startTime.split(':').map(Number);
          const itemTime = new Date();
          itemTime.setHours(hours, minutes, 0, 0);

          if (itemTime > now && itemTime <= fifteenMinutesFromNow) {
            const notificationId = `${'title' in item ? 'task' : 'class'}-${item.id}-${todayStr}`;
            if (!sentNotifications.has(notificationId)) {
              const subjectName = subjects.find(s => s.id === item.subjectId)?.name || 'Event';
              const title = 'title' in item ? `Task starting: ${item.title}` : `Class starting: ${subjectName}`;
              const body = `Scheduled to begin at ${item.startTime}.`;
              
              new window.Notification(title, { body });
              sentNotifications.add(notificationId);
            }
          }
        }
      });
      
      // 2. Unscheduled tasks due today (sent once per day)
      const dueTodayNotificationId = `due-today-${todayStr}`;
      if (!sentNotifications.has(dueTodayNotificationId)) {
        const tasksDueToday = homeTasks.filter(task => !task.completed && task.dueDate === todayStr && !task.startTime);
        if(tasksDueToday.length > 0){
          new window.Notification(`${tasksDueToday.length} task(s) due today`, {
            body: tasksDueToday.map(t => t.title).slice(0, 2).join(', ') + (tasksDueToday.length > 2 ? '...' : ''),
          });
          sentNotifications.add(dueTodayNotificationId);
        }
      }
    };
    
    checkNotifications();
    const interval = setInterval(checkNotifications, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [notificationPermission, classEvents, homeTasks, subjects]);
  // --- END NOTIFICATION LOGIC ---

  const todayViewItems = useMemo(() => {
    const today = new Date();
    const todayDay: DayOfWeek = DAYS_OF_WEEK[(today.getDay() + 6) % 7];

    const filteredClasses = classEvents.filter(event => event.day === todayDay);
    const filteredTasks = homeTasks.filter(task => task.day === todayDay && !!task.startTime);
    
    return {
        todaysClasses: filteredClasses,
        todaysTasks: filteredTasks,
    };
  }, [classEvents, homeTasks]);

  const handleOpenModal = useCallback((type: ModalState['type'], data: ModalState['data'] = null) => {
    setModalState({ type, data });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalState({ type: null, data: null });
  }, []);
  
  const handleSaveClass = useCallback((eventData: Omit<ClassEvent, 'id'> | ClassEvent) => {
    setClassEvents(prevEvents => {
        if ('id' in eventData) { // Editing
            return prevEvents.map(e => e.id === eventData.id ? eventData : e);
        } else { // Adding
            const newEvent: ClassEvent = { ...eventData, id: crypto.randomUUID() };
            return [...prevEvents, newEvent];
        }
    });
  }, []);

  const handleDeleteClass = useCallback((eventId: string) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
        setClassEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
        handleCloseModal();
    }
  }, [handleCloseModal]);
  
  const handleSaveHomeTask = useCallback((taskData: Omit<HomeTask, 'id' | 'completed'> | HomeTask) => {
     setHomeTasks(prevTasks => {
        if ('id' in taskData) { // Editing
            return prevTasks.map(t => t.id === taskData.id ? taskData : t);
        } else { // Adding
            const newTask: HomeTask = { ...taskData, id: crypto.randomUUID(), completed: false };
            return [...prevTasks, newTask];
        }
     });
  }, []);
  
  const handleDeleteHomeTask = useCallback((taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
        setHomeTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
        handleCloseModal();
    }
  }, [handleCloseModal]);

  const handleTaskToggle = useCallback((taskId: string) => {
    setHomeTasks(prevTasks => prevTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  }, []);

  const handleUpdateSubjects = useCallback((updatedSubjects: Subject[]) => {
      setSubjects(currentSubjects => {
        const deletedSubjectIds = currentSubjects.filter(s => !updatedSubjects.find(us => us.id === s.id)).map(s => s.id);
        
        if(deletedSubjectIds.length > 0) {
            setClassEvents(prev => prev.filter(e => !deletedSubjectIds.includes(e.subjectId)));
            setHomeTasks(prev => prev.filter(t => !deletedSubjectIds.includes(t.subjectId)));
        }
        return updatedSubjects;
      });
  }, []);

  const handleStartPomodoro = useCallback((task: HomeTask) => {
    if (pomodoroTask) {
        alert("Another focus session is already active. Please close it first.");
        return;
    }
    setPomodoroTask(task);
  }, [pomodoroTask]);

  const handleClosePomodoro = useCallback(() => {
    setPomodoroTask(null);
  }, []);

  const handlePomodoroComplete = useCallback((taskId: string) => {
    handleTaskToggle(taskId);
    setPomodoroTask(null);
  }, [handleTaskToggle]);

  const handleSavePomodoroSettings = useCallback((duration: number) => {
      setPomodoroDuration(duration);
  }, []);

  const handleAcceptSuggestion = useCallback((acceptedSlot: SuggestedTaskSlot) => {
      const timeToMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };
      const duration = timeToMinutes(acceptedSlot.endTime) - timeToMinutes(acceptedSlot.startTime);
      
      const newHomeTask: HomeTask = {
        ...acceptedSlot.task,
        id: crypto.randomUUID(),
        title: `${acceptedSlot.task.title} (${duration} min)`,
        estimatedTime: duration,
        day: acceptedSlot.day,
        startTime: acceptedSlot.startTime,
        content: `Study session for ${acceptedSlot.task.title}`,
      };
      
      setHomeTasks(prev => [...prev, newHomeTask]);
      // When accepting a suggestion, remove ALL other suggestions related to the original task
      setSuggestedSlots(prev => prev.filter(s => s.task.id !== acceptedSlot.task.id));
  }, []);

  const handleGenerateSchedule = useCallback(() => {
    // Helper to convert time string "HH:mm" to a 15-minute interval index (0-59) from 7:00 to 22:00
    const timeToIndex = (time: string): number => {
      const [h, m] = time.split(':').map(Number);
      if (h < 7) return 0;
      if (h >= 22) return (22 - 7) * 4;
      return (h - 7) * 4 + Math.floor(m / 15);
    };

    // Helper to convert an interval index back to a time string "HH:mm"
    const indexToTime = (index: number): string => {
      const totalMinutes = index * 15 + 7 * 60;
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    
    const intervalsPerDay = (22 - 7) * 4;
    const busyMap: Record<DayOfWeek, boolean[]> = {} as any;
    DAYS_OF_WEEK.forEach(day => {
        busyMap[day] = new Array(intervalsPerDay).fill(false);
    });

    const allScheduledItems = [
      ...classEvents,
      ...homeTasks.filter(t => t.day && t.startTime)
    ];

    allScheduledItems.forEach(item => {
      if (!item.day || !item.startTime) return;
      
      const endTime = 'endTime' in item 
        ? item.endTime! 
        : indexToTime(timeToIndex(item.startTime!) + Math.ceil((item as HomeTask).estimatedTime / 15));

      const startIdx = timeToIndex(item.startTime);
      const endIdx = timeToIndex(endTime);
      
      for (let i = startIdx; i < endIdx; i++) {
          if (i >= 0 && i < intervalsPerDay) {
            busyMap[item.day][i] = true;
          }
      }
    });

    // Function to find the next available slot and book it in the busyMap
    const findAndBookSlot = (
        startSearchDayIndex: number,
        startSearchTimeIndex: number,
        durationInIntervals: number
    ): { day: DayOfWeek; startTime: string } | null => {
        for (let d_offset = 0; d_offset < 7; d_offset++) {
            const currentDayIndex = (startSearchDayIndex + d_offset) % 7;
            const currentDay = DAYS_OF_WEEK[currentDayIndex];
            const searchStartIndex = (d_offset === 0) ? startSearchTimeIndex : 0;

            for (let i = searchStartIndex; i <= intervalsPerDay - durationInIntervals; i++) {
                let isFree = true;
                for (let j = 0; j < durationInIntervals; j++) {
                    if (busyMap[currentDay][i + j]) {
                        isFree = false;
                        i = i + j; // Smartly skip past the occupied block
                        break;
                    }
                }
                if (isFree) {
                    // Book the slot
                    for (let j = 0; j < durationInIntervals; j++) {
                        busyMap[currentDay][i + j] = true;
                    }
                    return { day: currentDay, startTime: indexToTime(i) };
                }
            }
        }
        return null; // No slot found
    };

    const newSuggestions: SuggestedTaskSlot[] = [];
    const HOMEWORK_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Literature', 'Extra English'];

    const sortedClassEvents = [...classEvents].sort((a, b) => {
        const dayA = DAYS_OF_WEEK.indexOf(a.day);
        const dayB = DAYS_OF_WEEK.indexOf(b.day);
        if (dayA !== dayB) return dayA - dayB;
        return timeToIndex(a.startTime) - timeToIndex(b.startTime);
    });

    for (const event of sortedClassEvents) {
        const subject = subjects.find(s => s.id === event.subjectId);
        if (!subject) continue;

        const eventDayIndex = DAYS_OF_WEEK.indexOf(event.day);
        const eventEndIndex = timeToIndex(event.endTime);

        // Schedule Homework for specific subjects
        if (HOMEWORK_SUBJECTS.includes(subject.name)) {
            const homeworkDuration = 45; // minutes
            const homeworkIntervals = Math.ceil(homeworkDuration / 15);
            const homeworkTask: HomeTask = {
                id: `gen-hw-${event.id}`,
                title: `Làm bài tập ${subject.name}`,
                subjectId: subject.id,
                dueDate: 'N/A',
                estimatedTime: homeworkDuration,
                priority: 'Medium',
                completed: false,
                content: `Generated homework for ${subject.name} class on ${event.day}.`,
            };
            
            // Try to schedule homework right after class
            const slot = findAndBookSlot(eventDayIndex, eventEndIndex, homeworkIntervals);
            if (slot) {
                newSuggestions.push({
                    id: `sug-hw-${event.id}`,
                    task: homeworkTask,
                    day: slot.day,
                    startTime: slot.startTime,
                    endTime: indexToTime(timeToIndex(slot.startTime) + homeworkIntervals)
                });
            }
        }

        // Schedule Review for all subjects
        const reviewDuration = 30; // minutes
        const reviewIntervals = Math.ceil(reviewDuration / 15);
        const reviewTask: HomeTask = {
            id: `gen-rev-${event.id}`,
            title: `Ôn tập ${subject.name}`,
            subjectId: subject.id,
            dueDate: 'N/A',
            estimatedTime: reviewDuration,
            priority: 'Medium',
            completed: false,
            content: `Generated review for ${subject.name} class on ${event.day}.`,
        };
        
        // Schedule review 1-2 days later, starting from the beginning of the day
        const reviewDayIndex = (eventDayIndex + 1);
        const slot = findAndBookSlot(reviewDayIndex, 0, reviewIntervals);
        if (slot) {
            newSuggestions.push({
                id: `sug-rev-${event.id}`,
                task: reviewTask,
                day: slot.day,
                startTime: slot.startTime,
                endTime: indexToTime(timeToIndex(slot.startTime) + reviewIntervals)
            });
        }
    }

    setSuggestedSlots(newSuggestions);
  }, [subjects, classEvents, homeTasks]);
  
  const handleClearSuggestions = useCallback(() => {
      setSuggestedSlots([]);
  }, []);

  const handleUpdateScheduleItemPosition = useCallback((itemId: string, newDay: DayOfWeek, newStartTime: string) => {
    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };
    const minutesToTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    let itemFound = false;
    
    // Check Class Events
    setClassEvents(prev => {
        const item = prev.find(i => i.id === itemId);
        if (item) {
            itemFound = true;
            const duration = timeToMinutes(item.endTime) - timeToMinutes(item.startTime);
            const newEndTime = minutesToTime(timeToMinutes(newStartTime) + duration);
            return prev.map(i => i.id === itemId ? { ...i, day: newDay, startTime: newStartTime, endTime: newEndTime } : i);
        }
        return prev;
    });
    if (itemFound) return;

    // Check Home Tasks
    setHomeTasks(prev => {
        const item = prev.find(i => i.id === itemId);
        if (item) {
            itemFound = true;
            return prev.map(i => i.id === itemId ? { ...i, day: newDay, startTime: newStartTime } : i);
        }
        return prev;
    });
    if (itemFound) return;
    
    // Check Suggested Slots
    setSuggestedSlots(prev => {
        const item = prev.find(i => i.id === itemId);
        if (item) {
            const duration = timeToMinutes(item.endTime) - timeToMinutes(item.startTime);
            const newEndTime = minutesToTime(timeToMinutes(newStartTime) + duration);
            return prev.map(i => i.id === itemId ? { ...i, day: newDay, startTime: newStartTime, endTime: newEndTime } : i);
        }
        return prev;
    });

  }, []);

  const handleMoveHomeTask = useCallback((taskId: string, newDay: DayOfWeek | null) => {
      setHomeTasks(prev => prev.map(task => {
          if (task.id === taskId) {
              if (newDay) {
                  return { ...task, day: newDay };
              } else {
                  // Moving to inbox: unschedule it
                  const { day, startTime, ...rest } = task;
                  return { ...rest };
              }
          }
          return task;
      }));
  }, []);

  const renderContent = () => {
    switch(activeTab) {
      case 'today':
        return <TodayView
          classEvents={todayViewItems.todaysClasses}
          homeTasks={todayViewItems.todaysTasks}
          subjects={subjects}
          onClassClick={event => handleOpenModal('editClass', event)}
          onTaskClick={task => handleOpenModal('editHomeTask', task)}
          onTaskToggle={handleTaskToggle}
        />;
      case 'class':
        return <ClassSchedule 
          events={classEvents} 
          subjects={subjects} 
          suggestions={suggestedSlots}
          homeTasks={homeTasks}
          onEventClick={event => handleOpenModal('editClass', event)}
          onScheduledTaskClick={task => handleOpenModal('editHomeTask', task)}
          onAcceptSuggestion={handleAcceptSuggestion}
          onUpdatePosition={handleUpdateScheduleItemPosition}
        />;
      case 'home':
        return <HomeSchedule 
          tasks={homeTasks} 
          subjects={subjects} 
          hasSuggestions={suggestedSlots.length > 0}
          onTaskToggle={handleTaskToggle} 
          onTaskClick={task => handleOpenModal('editHomeTask', task)}
          onStartPomodoro={handleStartPomodoro}
          onGenerateSchedule={handleGenerateSchedule}
          onClearSuggestions={handleClearSuggestions}
          onMoveTask={handleMoveHomeTask}
        />;
      default:
        return null;
    }
  }

  return (
    <>
      <StyleInjector />
      <PomodoroStyles />
       {pomodoroTask && (
            <PomodoroTimer
                task={pomodoroTask}
                onClose={handleClosePomodoro}
                onComplete={handlePomodoroComplete}
                durationInMinutes={pomodoroDuration}
                onOpenSettings={() => handleOpenModal('pomodoroSettings')}
            />
        )}
      <div className={`min-h-screen font-sans text-light-text dark:text-dark-text pb-32 transition-all duration-300 ${pomodoroTask ? 'pt-32' : ''}`}>
        <Header 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            theme={theme} 
            toggleTheme={toggleTheme} 
            notificationPermission={notificationPermission}
            onRequestNotifications={requestNotificationPermission}
        />
        <main className="max-w-7xl mx-auto p-2 sm:p-4">
          {renderContent()}
        </main>

        <FAB 
            onAddClass={() => handleOpenModal('addClass')} 
            onAddHomeTask={() => handleOpenModal('addHomeTask')}
            onManageSubjects={() => handleOpenModal('manageSubjects')}
        />

        <AddClassModal
          isOpen={modalState.type === 'addClass' || modalState.type === 'editClass'}
          onClose={handleCloseModal}
          onSave={handleSaveClass}
          onDelete={handleDeleteClass}
          subjects={subjects}
          eventToEdit={modalState.type === 'editClass' ? modalState.data as ClassEvent : null}
        />
        
        <AddHomeTaskModal
          isOpen={modalState.type === 'addHomeTask' || modalState.type === 'editHomeTask'}
          onClose={handleCloseModal}
          onSave={handleSaveHomeTask}
          onDelete={handleDeleteHomeTask}
          subjects={subjects}
          taskToEdit={modalState.type === 'editHomeTask' ? modalState.data as HomeTask : null}
        />

        <SubjectManagerModal
            isOpen={modalState.type === 'manageSubjects'}
            onClose={handleCloseModal}
            subjects={subjects}
            onUpdate={handleUpdateSubjects}
        />

        <PomodoroSettingsModal
            isOpen={modalState.type === 'pomodoroSettings'}
            onClose={handleCloseModal}
            onSave={handleSavePomodoroSettings}
            currentDuration={pomodoroDuration}
        />

      </div>
    </>
  );
};

export default App;