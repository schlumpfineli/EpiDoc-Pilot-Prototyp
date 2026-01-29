"use client";

import React, { useState } from 'react';
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addDays,
  isAfter,
  isToday as isTodayDate,
} from 'date-fns';
import { de } from 'date-fns/locale';

export interface CalendarProps {
  selectedDate: string; // ISO date string
  onDateSelect: (date: string) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
}

/**
 * Wiederverwendbare Calendar-Komponente
 * Fluide Größen und responsive Design
 */
export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabled = false,
  className = '',
}) => {
  const [currentMonth, setCurrentMonth] = useState(parseISO(selectedDate));
  const [isOpen, setIsOpen] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const selectedDateObj = parseISO(selectedDate);

  const isDateDisabled = (day: Date): boolean => {
    if (disabled) return true;
    if (minDate && isAfter(minDate, day)) return false;
    if (maxDate && isAfter(day, maxDate)) return true;
    if (isAfter(day, new Date())) return true;
    return false;
  };

  const handleDateClick = (day: Date) => {
    if (isDateDisabled(day)) return;
    const dayStr = format(day, 'yyyy-MM-dd');
    onDateSelect(dayStr);
    setIsOpen(false);
    setCurrentMonth(day);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center justify-between rounded-lg border border-background-200 bg-white px-[var(--spacing-m)] py-[var(--spacing-2xs)] text-body text-foreground-800 shadow-sm transition hover:border-primary-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{format(selectedDateObj, 'dd.MM.yyyy', { locale: de })}</span>
        <svg
          className="h-4 w-4 text-foreground-500 ml-[var(--spacing-2xs)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 sm:right-0 left-0 sm:left-auto z-20 mt-[var(--spacing-2xs)] rounded-2xl border border-background-200 bg-white p-[var(--spacing-s)] sm:p-[var(--spacing-m)] shadow-lg w-full sm:w-64 md:w-72 lg:w-80 max-w-sm sm:max-w-80">
            {/* Month Navigation */}
            <div className="mb-[var(--spacing-m)] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-600 transition hover:bg-background-100"
                aria-label="Vorheriger Monat"
              >
                ‹
              </button>
              <span className="text-body font-semibold text-foreground-900">
                {format(currentMonth, 'LLLL yyyy', { locale: de })}
              </span>
              <button
                type="button"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-600 transition hover:bg-background-100"
                aria-label="Nächster Monat"
              >
                ›
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-[var(--spacing-2xs)] text-center text-body-small font-semibold text-foreground-500">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i}>
                  {format(addDays(calendarStart, i), 'EEEEE', { locale: de })}
                </span>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="mt-[var(--spacing-2xs)] grid grid-cols-7 gap-[var(--spacing-2xs)]">
              {days.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const isSelected = dayStr === selectedDate;
                const isToday = dayStr === today;
                const dateDisabled = isDateDisabled(day);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

                return (
                  <button
                    key={dayStr}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    disabled={dateDisabled}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-body transition ${
                      dateDisabled
                        ? 'cursor-not-allowed text-foreground-300'
                        : isSelected
                          ? 'bg-primary-600 text-white shadow-sm'
                          : isToday
                            ? 'border border-primary-200 text-primary-700'
                            : isCurrentMonth
                              ? 'text-foreground-700 hover:bg-background-100'
                              : 'text-foreground-400 hover:bg-background-50'
                    }`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

