import React, { useEffect, useState } from 'react';
import ChecklistHistory from './checklist/ChecklistHistory';
import TechnicianDashboard from './moveinout/technician/TechnicianDashboard';
import { getRoleGroup } from '../utils/getRoleGroup';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);
 
  const rawRole = sessionStorage.getItem('role') || '' ;
  const userRole = getRoleGroup(rawRole) || '';
  // console.log('Dashboard userRole:', userRole);

  return (
    <div
      className="min-h-[80vh] w-full mx-auto dark:bg-gray-800"
      
    >
      <div
        className="dark:bg-gray-800"
        style={{
          background: 'rgba(255,255,255,0.95)',
          border: '2px solid #e5e7eb',
          borderRadius: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        {rawRole === 'System Administrator' && <ChecklistHistory />}
        {rawRole === 'TECHNICIAN' && <ChecklistHistory />}
      </div>
    </div>
  );
}