import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AssigningForm from '@/components/complaintcomponents/AssigningForm';

export default function AssignTechnicianPage() {
  const location = useLocation();
  const complaint = location.state?.complaint;
  const [assignLoading, setAssignLoading] = useState(false);

  // Example: categoryOptions should be fetched or imported
  const categoryOptions = [
    { value: '002', label: 'General' },
    { value: '004', label: 'Kitchen' },
    // ...other categories
  ];

  // Get unique categories from complaint.items
  const categories =
    complaint?.items && Array.isArray(complaint.items)
      ? Array.from(
          new Set(complaint.items.map((item: any) => item.category))
        ).map(catCode => ({
          code: catCode,
          desc:
            categoryOptions.find(opt => opt.value === catCode)?.label ||
            catCode,
        }))
      : [];

  // Example: technicians list should be fetched from API
  const technicians = [
    { tech_id: '1', uname: 'John Doe' },
    { tech_id: '2', uname: 'Jane Smith' },
    // ...
  ];

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 border border-gray-300 rounded-lg bg-white">
      <div className="text-center border-b border-gray-300 pb-4">
        <h1 className="text-2xl font-bold text-gray-700">Assign Technician</h1>
      </div>
      {/* Show selected categories */}
      <div>
        <label className="block text-sm font-semibold mb-2">Categories</label>
        <ul className="space-y-2">
          {categories.map(cat => (
            <li
              key={cat.code}
              className="p-2 bg-gray-50 rounded border border-gray-200"
            >
              {cat.desc}
            </li>
          ))}
        </ul>
      </div>
      {/* Technician assignment form */}
      <AssigningForm
        technicians={technicians}
        assignedTo={complaint?.assignedTo}
        scheduleDate={complaint?.scheduledTime}
        onAssign={(technician, date) => {
          // handle assignment logic here
        }}
        loading={assignLoading}
        disabled={false}
      />
    </div>
  );
}