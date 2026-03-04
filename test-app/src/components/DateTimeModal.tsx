import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface DateTimeModalProps {
  value?: Date;
  onChange: (date: Date) => void;
  onCancel?: () => void;
}

export default function DateTimeModal({ value, onChange, onCancel }: DateTimeModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(value || new Date());
  const [hour, setHour] = useState<number>(selectedDate.getHours() % 12 || 12);
  const [minute, setMinute] = useState<number>(selectedDate.getMinutes());
  const [ampm, setAmpm] = useState<string>(selectedDate.getHours() >= 12 ? 'PM' : 'AM');

  const handleDateChange = (date: Date | null) => {
    if (date) setSelectedDate(date);
  };

  // Increment/Decrement handlers
  const incHour = () => setHour(h => h === 12 ? 1 : h + 1);
  const decHour = () => setHour(h => h === 1 ? 12 : h - 1);
  const incMinute = () => setMinute(m => m === 59 ? 0 : m + 1);
  const decMinute = () => setMinute(m => m === 0 ? 59 : m - 1);
  const toggleAmpm = () => setAmpm(a => a === 'AM' ? 'PM' : 'AM');

  const handleSave = () => {
    const date = new Date(selectedDate);
    let h = hour;
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    date.setHours(h, minute);
    onChange(date);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-lg p-4"
      style={{
        minWidth: 420,
        width: 440,
        boxSizing: 'border-box',
        zIndex: 100,
      }}
    >
      <div className="flex flex-row gap-4">
        {/* Date column */}
        <div className="flex-1 flex flex-col items-center">
          <label className="block font-semibold mb-1">Date</label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            inline
          />
        </div>
        {/* Time and buttons column */}
        <div className="flex-1 flex flex-col items-center justify-between">
          <div>
            <label className="block font-semibold mb-1 text-center">Time</label>
            <div className="flex gap-2 items-center justify-center">
              {/* Hour */}
              <div className="flex flex-col items-center">
                <button type="button" onClick={incHour} className="px-1 text-lg font-bold">＋</button>

                <input
                  type="text"
                  value={hour.toString().padStart(2, '0')}
                  readOnly
                  className="w-10 text-center border rounded"
                  style={{ fontSize: 18 }}
                />
                <button type="button" onClick={decHour} className="px-1 text-lg font-bold">−</button>
              </div>
              <span style={{ fontSize: 18 }}>:</span>
              {/* Minute */}
              <div className="flex flex-col items-center">
                 <button type="button" onClick={incMinute} className="px-1 text-lg font-bold">＋</button>

                <input
                  type="text"
                  value={minute.toString().padStart(2, '0')}
                  readOnly
                  className="w-10 text-center border rounded"
                  style={{ fontSize: 18 }}
                />
                <button type="button" onClick={decMinute} className="px-1 text-lg font-bold">−</button>
              </div>
              {/* AM/PM */}
              <div className="flex flex-col items-center ml-2">
                 <button type="button" onClick={toggleAmpm} className="px-1">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 12l5-5 5 5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>

                <input
                  type="text"
                  value={ampm}
                  readOnly
                  className="w-12 text-center border rounded"
                  style={{ fontSize: 18 }}
                />
                <button type="button" onClick={toggleAmpm} className="px-1">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-6 justify-center w-full">
            {onCancel && (
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                onClick={onCancel}
                type="button"
              >
                Cancel
              </button>
            )}
            <button
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              onClick={handleSave}
              type="button"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}