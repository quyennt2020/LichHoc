import React, { useState, useRef, useEffect } from 'react';
import { CheckIcon } from './icons';

const ColorPicker: React.FC<{
  value: string;
  onChange: (color: string) => void;
  colorPalette: string[];
}> = ({ value, onChange, colorPalette }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  const handleSelect = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);
  
  // Extract the background color for the swatch display. It's the first class for light mode.
  // We need to handle dark mode as well for the swatch preview.
  const lightBgClass = value.split(' ').find(c => c.startsWith('bg-')) || 'bg-transparent';
  const darkBgClass = value.split(' ').find(c => c.startsWith('dark:bg-'))?.replace('dark:','') || lightBgClass;


  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className={`w-6 h-6 rounded-full cursor-pointer border-2 border-white dark:border-slate-500 shadow-sm ${lightBgClass} ${darkBgClass}`}
        aria-label="Select color"
      />
      {isOpen && (
        <div className="absolute z-10 top-full mt-2 w-48 bg-light-card dark:bg-dark-card rounded-md shadow-lg border border-light-border dark:border-dark-border p-2">
          <div className="grid grid-cols-5 gap-2">
            {colorPalette.map((color) => {
              const lightSwatchBg = color.split(' ').find(c => c.startsWith('bg-')) || 'bg-transparent';
              const darkSwatchBg = color.split(' ').find(c => c.startsWith('dark:bg-'))?.replace('dark:','') || lightSwatchBg;

              const isSelected = color === value;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleSelect(color)}
                  className={`w-8 h-8 rounded-full ${lightSwatchBg} ${darkSwatchBg} flex items-center justify-center transition-transform transform hover:scale-110`}
                  aria-label={`Select color ${lightSwatchBg}`}
                >
                  {isSelected && <CheckIcon className="w-5 h-5 text-white mix-blend-difference" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
