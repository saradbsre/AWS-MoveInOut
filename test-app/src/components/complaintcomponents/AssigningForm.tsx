import React, { useState } from 'react';
import Select from 'react-select';

interface Technician {
  tech_id: string;
  uname: string;
}

interface AssigningFormProps {
  technicians: Technician[];
  assignedTo?: string;
  scheduleDate?: string;
  onAssign: (technician: string, scheduleDate: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

const AssigningForm: React.FC<AssigningFormProps> = ({
  technicians,
  assignedTo = '',
  scheduleDate = '',
  onAssign,
  loading = false,
  disabled = false,
}) => {
  const [selectedTechnician, setSelectedTechnician] = useState(assignedTo);
  const [selectedDate, setSelectedDate] = useState(scheduleDate);

  return (
    <div className="flex flex-row gap-2 items-end mb-2">
      {/* Technician dropdown */}
      <div style={{ width: '32%' }}>
        <label className="font-semibold">Technician</label>
        <Select
          value={
            selectedTechnician
              ? { value: selectedTechnician, label: selectedTechnician }
              : null
          }
          onChange={option => setSelectedTechnician(option?.value || '')}
          options={technicians.map(t => ({
            value: t.uname,
            label: t.uname
          }))}
          isClearable
          isSearchable
          isDisabled={disabled}
          placeholder="Select Technician..."
        />
      </div>
      {/* Date input */}
      <div style={{ width: '20%' }}>
        <label className="font-semibold">Schedule Date & Time</label>
        <input
          type="datetime-local"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          disabled={disabled}
          className="w-full border rounded p-2"
        />
      </div>
      {/* Assign button */}
      <div style={{ width: '18%' }}>
        <button
          type="button"
          className="px-4 py-2 bg-green-600 text-white rounded border border-green-700 hover:bg-green-700 transition-colors w-full"
          onClick={() => onAssign(selectedTechnician, selectedDate)}
          disabled={disabled || loading || !selectedTechnician || !selectedDate}
        >
          {loading ? 'Assigning...' : 'Assign'}
        </button>
      </div>
    </div>
  );
};

export default AssigningForm;