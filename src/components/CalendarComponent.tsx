/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Program } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';

interface CalendarComponentProps {
  programs: Program[];
  onSelectProgram: (id: number) => void;
}

export default function CalendarComponent({ programs, onSelectProgram }: CalendarComponentProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // Default to May 2026 (matching our seeds)

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get total days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Prev month filler days count
  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build grid
  const daysGrid: { day: number; isCurrentMonth: boolean; dateString: string }[] = [];

  // Previous month buffer
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDay = prevMonthDays - i;
    const prevMonthDate = new Date(year, month - 1, prevDay);
    const mStr = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
    const dStr = String(prevMonthDate.getDate()).padStart(2, '0');
    daysGrid.push({
      day: prevDay,
      isCurrentMonth: false,
      dateString: `${prevMonthDate.getFullYear()}-${mStr}-${dStr}`
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(i).padStart(2, '0');
    daysGrid.push({
      day: i,
      isCurrentMonth: true,
      dateString: `${year}-${mStr}-${dStr}`
    });
  }

  // Next month buffer
  const totalSlots = 42; // 6 rows * 7 days
  const remainingSlots = totalSlots - daysGrid.length;
  for (let i = 1; i <= remainingSlots; i++) {
    const nextMonthDate = new Date(year, month + 1, i);
    const mStr = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
    const dStr = String(nextMonthDate.getDate()).padStart(2, '0');
    daysGrid.push({
      day: i,
      isCurrentMonth: false,
      dateString: `${nextMonthDate.getFullYear()}-${mStr}-${dStr}`
    });
  }

  const getStatusColor = (status: Program['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500 text-white';
      case 'ongoing':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-amber-500 text-white';
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs">
      <div className="flex bg-gray-50/50 p-2 rounded-2xl items-center justify-between mb-6">
        <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2 pl-2">
          <CalendarIcon className="w-5 h-5 text-emerald-600" />
          <span>{monthNames[month]} {year}</span>
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-2 text-gray-600 hover:bg-white hover:shadow-xs rounded-xl transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date(2026, 4, 1))}
            className="px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 bg-white shadow-3xs border border-emerald-100 rounded-lg transition-all"
          >
            Today (May 26)
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 text-gray-600 hover:bg-white hover:shadow-xs rounded-xl transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-xs font-semibold text-gray-400 py-1 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {daysGrid.map((cell, idx) => {
          // Filter programs matching this date
          const datePrograms = programs.filter(p => p.date === cell.dateString);
          const isTodayNum = cell.dateString === '2026-05-23'; // Static current time from user prompt settings

          return (
            <div
              key={idx}
              className={`min-h-[100px] border border-gray-50 rounded-xl p-1.5 flex flex-col justify-between transition-all ${
                cell.isCurrentMonth ? 'bg-white' : 'bg-gray-50/30 text-gray-400'
              } ${isTodayNum ? 'border-emerald-400 bg-emerald-50/10' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                    isTodayNum ? 'bg-emerald-600 text-white shadow-xs' : cell.isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                  }`}
                >
                  {cell.day}
                </span>
                {isTodayNum && (
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tight py-0.5 px-1 bg-emerald-100 rounded">
                    Today
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-col gap-1 flex-grow justify-end">
                {datePrograms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectProgram(p.id)}
                    className={`w-full text-left p-1 text-[10px] leading-tight font-medium rounded-lg shadow-3xs border border-black/5 hover:scale-[1.02] cursor-pointer hover:shadow-2xs transition-all truncate hover:z-10 ${getStatusColor(
                      p.status
                    )}`}
                    title={`${p.name} (${p.time})`}
                  >
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="opacity-85 text-[8px] flex items-center gap-1 truncate">
                      <Clock className="w-2 h-2 shrink-0 inline-block" />
                      <span>{p.time.split('-')[0].trim()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-gray-50 justify-center text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-amber-500 inline-block"></span>
          <span>Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-blue-500 inline-block"></span>
          <span>Ongoing</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}
