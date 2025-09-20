import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { Input } from './input';

interface DebouncedColorInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  debounceMs?: number;
}

export const DebouncedColorInput = memo(function DebouncedColorInput({
  value,
  onChange,
  label,
  className = '',
  debounceMs = 100
}: DebouncedColorInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isPickerActive, setIsPickerActive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pickerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local value when prop changes (but not during active picking)
  useEffect(() => {
    if (!isPickerActive) {
      setLocalValue(value);
    }
  }, [value, isPickerActive]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (pickerTimeoutRef.current) clearTimeout(pickerTimeoutRef.current);
    };
  }, []);

  const handleColorPickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setIsPickerActive(true);

    // Clear any existing picker timeout
    if (pickerTimeoutRef.current) {
      clearTimeout(pickerTimeoutRef.current);
    }

    // Clear any existing debounce timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set picker as inactive after a short delay
    pickerTimeoutRef.current = setTimeout(() => {
      setIsPickerActive(false);
    }, 500);

    // Debounce the onChange call
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  }, [onChange, debounceMs]);

  const handleTextInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the onChange call
    timeoutRef.current = setTimeout(() => {
      // Validate hex color format
      if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
        onChange(newValue);
      }
    }, debounceMs * 3); // Longer delay for text input
  }, [onChange, debounceMs]);

  return (
    <div className={className}>
      {label && (
        <label className='text-xs font-medium mb-1 block'>{label}</label>
      )}
      <div className='flex gap-1'>
        <input
          type='color'
          value={localValue}
          onChange={handleColorPickerChange}
          onMouseDown={() => setIsPickerActive(true)}
          onMouseUp={() => {
            if (pickerTimeoutRef.current) {
              clearTimeout(pickerTimeoutRef.current);
            }
            pickerTimeoutRef.current = setTimeout(() => {
              setIsPickerActive(false);
            }, 500);
          }}
          className='h-9 w-14 rounded border cursor-pointer'
        />
        <Input
          value={localValue}
          onChange={handleTextInputChange}
          placeholder='#000000'
          className='flex-1'
        />
      </div>
    </div>
  );
});