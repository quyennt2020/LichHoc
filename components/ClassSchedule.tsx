import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { ClassEvent, Subject, DayOfWeek, SuggestedTaskSlot, HomeTask } from '../types';
import { DAYS_OF_WEEK } from '../constants';
import { StarIcon, ClipboardIcon, ZoomInIcon, ZoomOutIcon, ClockIcon, Bars3Icon, HomeIcon, CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, SparklesIcon } from './icons';

interface ClassScheduleProps {
  events: ClassEvent[];
  subjects: Subject[];
  suggestions: SuggestedTaskSlot[];
  homeTasks: HomeTask[];
  onEventClick: (event: ClassEvent) => void;
  onScheduledTaskClick: (task: HomeTask) => void;
  onSuggestionClick: (suggestion: SuggestedTaskSlot) => void;
  onUpdatePosition: (itemId: string, newDay: DayOfWeek, newStartTime: string) => void;
}

// --- HELPERS ---
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const clampedMinutes = Math.max(0, Math.min(24 * 60 - 1, minutes));
  const hours = Math.floor(clampedMinutes / 60);
  const mins = Math.round(clampedMinutes % 60);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

// Type Guards & Types
type ScheduledHomeTask = HomeTask & { endTime: string };
type ScheduleItem = ClassEvent | SuggestedTaskSlot | ScheduledHomeTask;
const isSuggestion = (item: ScheduleItem): item is SuggestedTaskSlot => 'task' in item;
const isHomeTask = (item: ScheduleItem): item is ScheduledHomeTask => 'dueDate' in item && !isSuggestion(item);
const isClassEvent = (item: ScheduleItem): item is ClassEvent => !isSuggestion(item) && !isHomeTask(item);


// --- TOOLTIP COMPONENT ---
const Tooltip: React.FC<{ item: ScheduleItem, subject?: Subject, position: { x: number, y: number } }> = ({ item, subject, position }) => {
    if (!item || !subject) return null;

    const duration = timeToMinutes(item.endTime) - timeToMinutes(item.startTime);

    let title, subtitle, showClassDetails;
    if (isSuggestion(item)) {
        title = item.task.title;
        subtitle = `(Suggested Session - ${duration} min)`;
        showClassDetails = false;
    } else if (isHomeTask(item)) {
        title = item.title;
        subtitle = `(Study Task - ${duration} min)`;
        showClassDetails = false;
    } else { // isClassEvent
        title = subject.name;
        subtitle = subject.name;
        showClassDetails = true;
    }

    const tooltipStyle: React.CSSProperties = {
        position: 'fixed',
        top: position.y + 10,
        left: position.x + 10,
        pointerEvents: 'none',
        zIndex: 1000,
    };

    return ReactDOM.createPortal(
        <div style={tooltipStyle} className="bg-light-card text-light-text dark:bg-dark-card dark:text-dark-text rounded-md shadow-lg p-3 text-sm transition-opacity duration-200">
            <h4 className="font-bold">{title}</h4>
            <p className="text-xs italic text-gray-500 dark:text-slate-400">{subtitle}</p>
            <p>{item.startTime} - {item.endTime}</p>
            {showClassDetails && (
              <>
                {'room' in item && item.room && <p>Room: {item.room}</p>}
                {'teacher' in item && item.teacher && <p>Teacher: {item.teacher}</p>}
              </>
            )}
        </div>,
        document.body
    );
};


// Add a map to resolve Tailwind color classes to hex values for SVG styling.
const tailwindColorMap: { [key: string]: { [key: string]: string } } = {
    red:    { '200': '#fecaca', '300': '#fca5a5', '800': '#991b1b' },
    blue:   { '200': '#bfdbfe', '300': '#93c5fd', '800': '#1e40af' },
    green:  { '200': '#bbf7d0', '300': '#86efac', '800': '#166534' },
    yellow: { '200': '#fef08a', '300': '#fde047', '800': '#854d0e' },
    purple: { '200': '#e9d5ff', '300': '#d8b4fe', '800': '#6b21a8' },
    pink:   { '200': '#fbcfe8', '300': '#f9a8d4', '800': '#9d174d' },
    indigo: { '200': '#c7d2fe', '300': '#a5b4fc', '800': '#3730a3' },
    teal:   { '200': '#99f6e4', '300': '#5eead4', '800': '#115e59' },
    gray:   { '200': '#e5e7eb', '300': '#d1d5db', '800': '#1f2937' },
    rose:   { '400': '#fb7185', '500': '#f43f5e' },
    sky:    { '400': '#38bdf8', '500': '#0ea5e9' },
    emerald:{ '400': '#34d399', '500': '#10b981' },
    amber:  { '400': '#f59e0b', '500': '#f59e0b' },
    violet: { '400': '#8b5cf6', '500': '#7c3aed' },
    fuchsia:{ '400': '#d946ef', '500': '#c026d3' },
    slate:  { '400': '#94a3b8' }
};

// --- CLOCK VIEW COMPONENT ---
const ClockDayView: React.FC<{
    dayEvents: ScheduleItem[];
    getSubject: (id: string) => Subject | undefined;
    onEventClick: (event: ClassEvent) => void;
    onScheduledTaskClick: (task: HomeTask) => void;
    onSuggestionClick: (suggestion: SuggestedTaskSlot) => void;
    setHoveredEvent: (state: { item: ScheduleItem; position: { x: number; y: number; } } | null) => void;
    zoomLevel: number;
}> = ({ dayEvents, getSubject, onEventClick, onScheduledTaskClick, onSuggestionClick, setHoveredEvent, zoomLevel }) => {
    
    const size = 280 * (zoomLevel / 100);
    const center = size / 2;
    const baseRadius = size / 2.5;
    const strokeWidth = size / 15;

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(x, y, radius, startAngle);
        const end = polarToCartesian(x, y, radius, endAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        const sweepFlag = "1"; // 1 for clockwise, 0 for counter-clockwise
        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
    };

    const eventLayouts = useMemo(() => {
        const sortedEvents = dayEvents.map(event => ({
            ...event,
            startMin: timeToMinutes(event.startTime),
            endMin: timeToMinutes(event.endTime),
        })).sort((a, b) => a.startMin - b.startMin);
        
        type EventWithTime = typeof sortedEvents[0];
        const levels: EventWithTime[][] = [];
        
        sortedEvents.forEach(event => {
            let placed = false;
            for (const level of levels) {
                if (level.length === 0 || level[level.length - 1].endMin <= event.startMin) {
                    level.push(event);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                levels.push([event]);
            }
        });
        
        return sortedEvents.map(event => {
            const levelIndex = levels.findIndex(level => level.some(e => e.id === event.id));
            const radius = baseRadius - (levelIndex * (strokeWidth + 2));
            const startAngle = (event.startMin / (24 * 60)) * 360;
            const endAngle = (event.endMin / (24 * 60)) * 360;
            return { ...event, radius, startAngle, endAngle };
        });
    }, [dayEvents, baseRadius, strokeWidth]);

    const isDarkMode = document.documentElement.classList.contains('dark');

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={center} cy={center} r={baseRadius + strokeWidth / 2 + 4} fill="none" stroke="rgba(128,128,128,0.1)" strokeWidth="1" />
             {/* Hour markers */}
            {Array.from({ length: 24 }).map((_, i) => {
                const angle = i * 15;
                const isMajor = i % 6 === 0;
                const label = `${(i === 0 || i === 24) ? 12 : i > 12 ? i - 12 : i} ${i < 12 || i === 24 ? 'AM' : 'PM'}`
                const p1 = polarToCartesian(center, center, baseRadius + strokeWidth / 2 + (isMajor ? 12 : 4), angle);
                const p2 = polarToCartesian(center, center, baseRadius + strokeWidth / 2, angle);
                const pLabel = polarToCartesian(center, center, baseRadius + strokeWidth / 2 + (isMajor ? 22 : 4), angle);
                
                return (
                    <g key={i}>
                        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(128,128,128,0.3)" strokeWidth={isMajor ? 1.5 : 1} />
                        {isMajor && (
                            <text 
                                x={pLabel.x} 
                                y={pLabel.y} 
                                textAnchor="middle" 
                                dominantBaseline="central" 
                                className="text-[8px] sm:text-[10px] fill-current text-slate-500 dark:text-slate-400"
                                style={{ fontSize: size / 35 }}
                            >
                                {label}
                            </text>
                        )}
                    </g>
                );
            })}

            {eventLayouts.map(layout => {
                let subjectId: string;
                if (isSuggestion(layout)) subjectId = layout.task.subjectId;
                else subjectId = layout.subjectId;

                const subject = getSubject(subjectId);
                if (!subject) return null;

                const lightColorClass = subject.color.split(' ').find(c => c.startsWith('border-') && c !== 'border-l-4') || 'border-slate-400';
                const darkColorClassRaw = subject.color.split(' ').find(c => c.startsWith('dark:border-'));
                const finalColorClass = isDarkMode && darkColorClassRaw ? darkColorClassRaw.replace('dark:', '') : lightColorClass;
                
                const colorParts = finalColorClass.split('-');
                const colorName = colorParts[1];
                const colorShade = colorParts[2];
                const color = tailwindColorMap[colorName]?.[colorShade] ?? '#94a3b8';


                const getDashArray = () => {
                    if (isSuggestion(layout)) return "4 4";
                    if (isHomeTask(layout)) return "8 4";
                    return "none";
                }

                return (
                    <path
                        key={layout.id}
                        d={describeArc(center, center, layout.radius, layout.startAngle, layout.endAngle)}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={getDashArray()}
                        className="cursor-pointer transition-opacity duration-200 hover:opacity-80"
                        style={{ opacity: isClassEvent(layout) ? 1 : (isHomeTask(layout) ? 0.9 : 0.75) }}
                        onClick={() => {
                            if (isSuggestion(layout)) onSuggestionClick(layout);
                            else if (isHomeTask(layout)) onScheduledTaskClick(layout);
                            else onEventClick(layout);
                        }}
                        onMouseEnter={(e) => setHoveredEvent({ item: layout, position: { x: e.clientX, y: e.clientY } })}
                        onMouseLeave={() => setHoveredEvent(null)}
                        onMouseMove={(e) => setHoveredEvent({ item: layout, position: { x: e.clientX, y: e.clientY } })}
                    />
                );
            })}
        </svg>
    );
};

// --- MONTH VIEW COMPONENT ---
const MonthView: React.FC<Omit<ClassScheduleProps, 'onUpdatePosition' | 'onAcceptSuggestion'> & {
    onSuggestionClick: (suggestion: SuggestedTaskSlot) => void;
    currentMonth: Date;
    setCurrentMonth: (date: Date) => void;
    getSubject: (subjectId: string) => Subject | undefined;
}> = ({ events, subjects, suggestions, homeTasks, onEventClick, onScheduledTaskClick, onSuggestionClick, currentMonth, setCurrentMonth, getSubject }) => {
    const [selectedDayData, setSelectedDayData] = useState<{ date: Date; items: ScheduleItem[]; ref: HTMLDivElement | null } | null>(null);
    const isDarkMode = document.documentElement.classList.contains('dark');

    const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const handleToday = () => setCurrentMonth(new Date());

    const calendarDays = useMemo(() => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const days: { date: Date, isCurrentMonth: boolean, isToday: boolean, items: ScheduleItem[] }[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfWeek = (date.getDay() + 6) % 7; // Monday is 0

        // Days from previous month
        for (let i = 0; i < firstDayOfWeek; i++) {
            const prevMonthDay = new Date(date);
            prevMonthDay.setDate(date.getDate() - (firstDayOfWeek - i));
            days.push({ date: prevMonthDay, isCurrentMonth: false, isToday: false, items: [] });
        }

        // Days of current month
        while (date.getMonth() === currentMonth.getMonth()) {
            const dayDate = new Date(date);
            const dayOfWeek = DAYS_OF_WEEK[(dayDate.getDay() + 6) % 7];
            const isToday = dayDate.getTime() === today.getTime();

            const dayEvents = events.filter(e => e.day === dayOfWeek);
            const daySuggestions = suggestions.filter(s => s.day === dayOfWeek);
            const dayHomeTasks: ScheduledHomeTask[] = homeTasks
                .filter(t => t.day === dayOfWeek && t.startTime)
                .map(t => ({...t, endTime: minutesToTime(timeToMinutes(t.startTime!) + t.estimatedTime)}));
            
            const allDayItems: ScheduleItem[] = [...dayEvents, ...daySuggestions, ...dayHomeTasks];

            days.push({ date: new Date(date), isCurrentMonth: true, isToday, items: allDayItems });
            date.setDate(date.getDate() + 1);
        }

        // Days from next month
        while (days.length % 7 !== 0) {
            days.push({ date: new Date(date), isCurrentMonth: false, isToday: false, items: [] });
            date.setDate(date.getDate() + 1);
        }
        return days;

    }, [currentMonth, events, suggestions, homeTasks]);
    
     useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (selectedDayData && !(event.target as HTMLElement).closest('.day-popover')) {
                setSelectedDayData(null);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [selectedDayData]);

    const DayPopover = () => {
        if (!selectedDayData || !selectedDayData.ref) return null;
        
        const rect = selectedDayData.ref.getBoundingClientRect();
        const style: React.CSSProperties = {
            position: 'fixed',
            top: rect.bottom + 5,
            left: rect.left,
            zIndex: 1010,
        };

        return ReactDOM.createPortal(
             <div style={style} className="day-popover bg-light-bg dark:bg-dark-bg rounded-lg shadow-2xl w-64 max-h-80 overflow-y-auto border border-light-border dark:border-dark-border">
                <div className="flex justify-between items-center p-2 sticky top-0 bg-light-bg dark:bg-dark-bg border-b border-light-border dark:border-dark-border">
                    <h4 className="font-bold">{selectedDayData.date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
                    <button onClick={() => setSelectedDayData(null)}><CloseIcon className="w-5 h-5" /></button>
                </div>
                {selectedDayData.items.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500 dark:text-slate-400">No scheduled items.</p>
                ) : (
                    <ul className="divide-y divide-light-border dark:divide-dark-border">
                        {selectedDayData.items.sort((a,b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)).map(item => {
                            let subjectId: string;
                            let title: string;
                            
                            if (isSuggestion(item)) {
                                subjectId = item.task.subjectId;
                                title = item.task.title;
                            } else if (isHomeTask(item)) {
                                subjectId = item.subjectId;
                                title = item.title;
                            } else {
                                subjectId = item.subjectId;
                                title = getSubject(subjectId)?.name || 'Class';
                            }
                            const subject = getSubject(subjectId);
                            const lightColorClass = subject?.color.split(' ').find(c => c.startsWith('border-') && c !== 'border-l-4') || 'border-slate-400';
                            const darkColorClassRaw = subject?.color.split(' ').find(c => c.startsWith('dark:border-'));
                            const borderColorClass = isDarkMode && darkColorClassRaw ? darkColorClassRaw.replace('dark:', '') : lightColorClass;

                            return (
                                <li key={item.id} className="p-2 hover:bg-light-card dark:hover:bg-dark-card transition-colors cursor-pointer" onClick={() => {
                                    if (isSuggestion(item)) onSuggestionClick(item);
                                    else if (isHomeTask(item)) onScheduledTaskClick(item);
                                    else onEventClick(item);
                                    setSelectedDayData(null);
                                }}>
                                    <div className={`flex items-center gap-2 border-l-4 ${borderColorClass} pl-2`}>
                                        <div className="flex-grow">
                                            <p className="font-semibold text-sm">{title}</p>
                                            <p className="text-xs text-gray-500">{item.startTime} - {item.endTime}</p>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>,
            document.body
        );
    };

    return (
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><ChevronLeftIcon /></button>
                <div className="text-center">
                    <h2 className="text-xl font-bold">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={handleToday} className="text-sm text-brand-primary hover:underline">Today</button>
                </div>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"><ChevronRightIcon /></button>
            </div>
            <div className="grid grid-cols-7 gap-px bg-light-border dark:bg-dark-border border border-light-border dark:border-dark-border rounded-md overflow-hidden">
                {DAYS_OF_WEEK.map(day => (
                    <div key={day} className="text-center font-semibold text-sm py-2 bg-light-bg dark:bg-dark-bg">{day.substring(0, 3)}</div>
                ))}
                {calendarDays.map(({ date, isCurrentMonth, isToday, items }, index) => {
                    const dayRef = React.useRef<HTMLDivElement>(null);
                    return (
                        <div
                            key={index}
                            ref={dayRef}
                            className={`relative p-2 h-24 sm:h-32 flex flex-col overflow-hidden transition-colors duration-200 ${items.length > 0 ? 'cursor-pointer' : ''} ${
                                isCurrentMonth ? 'bg-light-card dark:bg-dark-card' : 'bg-gray-50 dark:bg-slate-950 text-slate-500'
                            } ${isCurrentMonth && items.length > 0 ? 'hover:bg-gray-100 dark:hover:bg-slate-800' : ''}`}
                            onClick={() => {
                                if (items.length > 0) {
                                    setSelectedDayData({ date, items, ref: dayRef.current });
                                }
                            }}
                        >
                            <span className={`absolute top-1.5 right-1.5 text-xs font-semibold ${isToday ? 'bg-brand-primary text-white rounded-full w-5 h-5 flex items-center justify-center' : ''}`}>
                                {date.getDate()}
                            </span>
                             <div className="mt-5 flex flex-wrap gap-1">
                                {items.slice(0, 6).map(item => {
                                    const subjectId = isSuggestion(item) ? item.task.subjectId : item.subjectId;
                                    const subject = getSubject(subjectId);
                                    
                                    const lightColorClass = subject?.color.split(' ').find(c => c.startsWith('border-') && c !== 'border-l-4') || 'border-slate-400';
                                    const darkColorClassRaw = subject?.color.split(' ').find(c => c.startsWith('dark:border-'));
                                    const finalColorClass = isDarkMode && darkColorClassRaw ? darkColorClassRaw.replace('dark:', '') : lightColorClass;
                                    
                                    const colorParts = finalColorClass.split('-');
                                    const colorName = colorParts[1];
                                    const colorShade = colorParts[2];
                                    const backgroundColor = tailwindColorMap[colorName]?.[colorShade] || '#94a3b8';
                                    
                                    return (
                                        <div key={item.id} style={{ backgroundColor }} className={`w-2 h-2 rounded-full ${isSuggestion(item) ? 'ring-2 ring-offset-1 ring-brand-secondary/50' : ''}`}></div>
                                    );
                                })}
                                {items.length > 6 && <div className="text-xs text-slate-500">+...</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
            <DayPopover />
        </div>
    );
};


const ClassSchedule: React.FC<ClassScheduleProps> = (props) => {
  const { events, subjects, suggestions, homeTasks, onEventClick, onScheduledTaskClick, onSuggestionClick, onUpdatePosition } = props;
  const [view, setView] = useState<'timeline' | 'clock' | 'month'>('timeline');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [hoveredEvent, setHoveredEvent] = useState<{ item: ScheduleItem, position: { x: number, y: number } } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);


   useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const getSubject = (subjectId: string): Subject | undefined => subjects.find(s => s.id === subjectId);

  const scheduledHomeTasks: ScheduledHomeTask[] = useMemo(() => homeTasks
    .filter(t => t.day && t.startTime)
    .map(t => ({
      ...t,
      endTime: minutesToTime(timeToMinutes(t.startTime!) + t.estimatedTime),
    }))
  , [homeTasks]);

  const allItems: ScheduleItem[] = [...events, ...suggestions, ...scheduledHomeTasks];

  const eventsByDay = useMemo(() => {
    // Deduplicate allItems before grouping by day to prevent visual bugs
    const seenIds = new Set<string>();
    const uniqueItems = allItems.filter(item => {
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    });

    return DAYS_OF_WEEK.reduce((acc, day) => {
      acc[day] = uniqueItems.filter(item => item.day === day);
      return acc;
    }, {} as Record<DayOfWeek, ScheduleItem[]>);
  }, [allItems]);

  const hourHeight = 60 * (zoomLevel / 100);
  const timeToPosition = (time: string) => (timeToMinutes(time) - 7 * 60) / 60 * hourHeight;
  const eventDuration = (startTime: string, endTime: string) => (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60 * hourHeight;

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, item: ScheduleItem) => {
      e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id }));
      setDraggingItemId(item.id);
  };
  
  const handleDragEnd = () => {
      setDraggingItemId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent, day: DayOfWeek) => {
      e.preventDefault();
      setDraggingItemId(null);
      
      const itemData = JSON.parse(e.dataTransfer.getData('application/json'));
      const itemId = itemData.id;

      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();
      const dropY = e.clientY - rect.top;

      const minutesFromTop = (dropY / hourHeight) * 60;
      const totalMinutes = minutesFromTop + 7 * 60; // Add the 7:00 start offset
      const newStartTime = minutesToTime(totalMinutes);

      onUpdatePosition(itemId, day, newStartTime);
  };

  const renderTimelineView = () => {
    const todayDay = DAYS_OF_WEEK[(currentTime.getDay() + 6) % 7];
    const minutesNow = currentTime.getHours() * 60 + currentTime.getMinutes();
    const showTimeIndicator = minutesNow >= 7 * 60 && minutesNow <= 22 * 60;

    return (
        <div className="relative grid grid-cols-[auto_1fr] gap-x-2">
        {/* Time labels */}
        <div className="relative -top-3">
            {Array.from({ length: 16 }, (_, i) => i + 7).map(hour => (
            <div key={hour} className="relative text-right pr-2 text-sm text-slate-500 dark:text-slate-400" style={{ height: hourHeight }}>
                <span className="absolute -top-2 right-2">{`${hour}:00`}</span>
            </div>
            ))}
        </div>

        {/* Grid */}
        <div ref={gridRef} className="grid grid-cols-7 gap-1 relative">
            {DAYS_OF_WEEK.map(day => (
            <div 
              key={day} 
              className="relative border-r border-slate-200 dark:border-slate-700/50"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
            >
                {Array.from({ length: 15 }, (_, i) => (
                <div key={i} style={{ height: hourHeight }} className="border-b border-dashed border-slate-200 dark:border-slate-700/50"></div>
                ))}
                {/* Current Time Indicator */}
                {day === todayDay && showTimeIndicator && (
                    <div className="absolute w-[calc(100%+4px)] -left-0.5 h-0.5 bg-red-500 z-20" style={{ top: timeToPosition(minutesToTime(minutesNow)) }}>
                        <div className="absolute -left-1 -top-1 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                    </div>
                )}
                {eventsByDay[day]?.map(item => {
                const subjectId = isSuggestion(item) ? item.task.subjectId : item.subjectId;
                const subject = getSubject(subjectId);
                if (!subject) return null;
                
                const isEventHighlighted = isClassEvent(item) && item.highlighted;

                return (
                    <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragEnd={handleDragEnd}
                        className={
                            `absolute w-full p-2 rounded-md transition-all duration-200 cursor-grab flex flex-col overflow-hidden ${subject.color} ` +
                            (isSuggestion(item) ? 'border-2 border-dashed border-brand-secondary/50' : '')
                        }
                        style={{
                            top: timeToPosition(item.startTime),
                            height: eventDuration(item.startTime, item.endTime),
                            opacity: draggingItemId === item.id ? 0.5 : (isEventHighlighted ? 1 : (isClassEvent(item) ? 0.95 : 0.85)),
                            backgroundImage: isSuggestion(item) 
                                ? 'repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 16px)'
                                : 'none',
                            boxShadow: isEventHighlighted ? '0 0 15px rgba(255, 235, 59, 0.7)' : (isSuggestion(item) ? '0 0 10px rgba(236, 72, 153, 0.3)' : '0 1px 3px rgba(0,0,0,0.05)'),
                            zIndex: draggingItemId === item.id ? 20 : (isEventHighlighted ? 10 : (isSuggestion(item) ? 5 : 1))
                        }}
                        onClick={() => {
                            if (isSuggestion(item)) onSuggestionClick(item);
                            else if (isHomeTask(item)) onScheduledTaskClick(item as HomeTask);
                            else onEventClick(item as ClassEvent);
                        }}
                        onMouseEnter={(e) => setHoveredEvent({ item, position: { x: e.clientX, y: e.clientY } })}
                        onMouseLeave={() => setHoveredEvent(null)}
                        onMouseMove={(e) => setHoveredEvent({ item, position: { x: e.clientX, y: e.clientY } })}
                    >
                        {isSuggestion(item) && (
                            <div className="absolute top-1 right-1 bg-white/30 rounded-full p-0.5">
                                <SparklesIcon className="w-3 h-3 text-white" />
                            </div>
                        )}
                        <strong className="font-semibold text-sm leading-tight truncate">
                            {isClassEvent(item) ? subject.name : ('task' in item ? item.task.title : item.title)}
                        </strong>
                        <span className="text-xs opacity-80 mt-auto">
                            {item.startTime} - {item.endTime}
                        </span>
                    </div>
                );
                })}
            </div>
            ))}
        </div>
        </div>
    );
  }
  
  const renderClockView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 p-4 justify-items-center">
        {DAYS_OF_WEEK.map(day => (
            <div key={day} className="flex flex-col items-center">
                <h3 className="font-bold text-lg mb-2">{day}</h3>
                <ClockDayView 
                    dayEvents={eventsByDay[day]} 
                    getSubject={getSubject} 
                    onEventClick={onEventClick} 
                    onScheduledTaskClick={onScheduledTaskClick}
                    onSuggestionClick={onSuggestionClick}
                    setHoveredEvent={setHoveredEvent}
                    zoomLevel={zoomLevel}
                />
            </div>
        ))}
    </div>
  );

  return (
    <div className="bg-light-bg dark:bg-dark-bg p-2 sm:p-4 rounded-lg">
      {hoveredEvent && <Tooltip item={hoveredEvent.item} subject={getSubject(isSuggestion(hoveredEvent.item) ? hoveredEvent.item.task.subjectId : hoveredEvent.item.subjectId)} position={hoveredEvent.position} />}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <div className="flex items-center gap-2 p-1 bg-light-card dark:bg-dark-card rounded-lg">
          <button onClick={() => setView('timeline')} className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${view === 'timeline' ? 'bg-brand-primary text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`}><Bars3Icon className="w-5 h-5"/>Timeline</button>
          <button onClick={() => setView('clock')} className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${view === 'clock' ? 'bg-brand-primary text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`}><ClockIcon className="w-5 h-5"/>Clock</button>
          <button onClick={() => setView('month')} className={`px-3 py-1 rounded-md text-sm flex items-center gap-1 ${view === 'month' ? 'bg-brand-primary text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-700'}`}><CalendarDaysIcon className="w-5 h-5"/>Month</button>
        </div>
        {(view === 'timeline' || view === 'clock') && (
            <div className="flex items-center gap-2 p-1 bg-light-card dark:bg-dark-card rounded-lg">
            <button onClick={() => setZoomLevel(z => Math.max(z - 10, 50))} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700"><ZoomOutIcon className="w-5 h-5"/></button>
            <span className="text-sm w-12 text-center">{zoomLevel}%</span>
            <button onClick={() => setZoomLevel(z => Math.min(z + 10, 200))} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-slate-700"><ZoomInIcon className="w-5 h-5"/></button>
            </div>
        )}
      </div>

      <div className="overflow-x-auto no-scrollbar">
          {view === 'timeline' && (
              <div style={{ width: `${zoomLevel}%` }} className="min-w-full">
                  <div className="grid grid-cols-[auto_1fr] mb-2">
                      <div></div>
                      <div className="grid grid-cols-7 border-b border-light-border dark:border-dark-border">
                          {DAYS_OF_WEEK.map(day => (
                              <h2 key={day} className="text-center font-bold p-2 text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">{day.substring(0,3)}</h2>
                          ))}
                      </div>
                  </div>
                  {renderTimelineView()}
              </div>
          )}
          {view === 'clock' && renderClockView()}
          {view === 'month' && (
              <MonthView
                  events={events}
                  subjects={subjects}
                  suggestions={suggestions}
                  homeTasks={homeTasks}
                  onEventClick={onEventClick}
                  onScheduledTaskClick={onScheduledTaskClick}
                  onSuggestionClick={onSuggestionClick}
                  currentMonth={currentMonth}
                  setCurrentMonth={setCurrentMonth}
                  getSubject={getSubject}
              />
          )}
      </div>
    </div>
  );
};

export default ClassSchedule;