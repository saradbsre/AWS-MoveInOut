import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';
import PageLoader from '@/components/PageLoader';

type Checklist = {
  refNum: string;
  id: string | number;
  submissionDate?: string;
  visitType?: string;
  tenant?: string;
  building?: string;
  unit?: string;
  contractNo?: string;
  startDate?: string;
  endDate?: string;
  technician?: string;
};

export default function TechnicianDashboard() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const username = sessionStorage.getItem('username') || '';
  const roleid = sessionStorage.getItem('role');
  const [barFilter, setBarFilter] = useState('weekly');

  const moveInCount = checklists.filter(c => c.visitType?.toLowerCase() === 'move in').length;
  const moveOutCount = checklists.filter(c => c.visitType?.toLowerCase() === 'move out').length;
  const pieData = [
    { name: 'Move In', value: moveInCount },
    { name: 'Move Out', value: moveOutCount },
  ];
  const COLORS = ['#28a745', '#dc3545'];

  const getBarData = () => {
    const now = new Date();
    let filtered = [];
    if (barFilter === 'weekly') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        filtered.push({
          date: dateStr,
          moveIn: checklists.filter(c => c.visitType?.toLowerCase() === 'move in' && c.submissionDate?.slice(0, 10) === dateStr).length,
          moveOut: checklists.filter(c => c.visitType?.toLowerCase() === 'move out' && c.submissionDate?.slice(0, 10) === dateStr).length,
        });
      }
    } else if (barFilter === 'monthly') {
      // This month, group by day
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        filtered.push({
          date: dateStr,
          moveIn: checklists.filter(c => c.visitType?.toLowerCase() === 'move in' && c.submissionDate?.slice(0, 10) === dateStr).length,
          moveOut: checklists.filter(c => c.visitType?.toLowerCase() === 'move out' && c.submissionDate?.slice(0, 10) === dateStr).length,
        });
      }
    } else if (barFilter === 'yearly') {
      // This year, group by month
      const year = now.getFullYear();
      for (let m = 0; m < 12; m++) {
        const monthStr = `${year}-${String(m + 1).padStart(2, '0')}`;
        filtered.push({
          date: monthStr,
          moveIn: checklists.filter(c => c.visitType?.toLowerCase() === 'move in' && c.submissionDate?.startsWith(monthStr)).length,
          moveOut: checklists.filter(c => c.visitType?.toLowerCase() === 'move out' && c.submissionDate?.startsWith(monthStr)).length,
        });
      }
    }
    return filtered;
  };

  const barData = getBarData();

  useEffect(() => {
    const fetchChecklists = async () => {
      setLoading(true);
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/checklistshistory-all`;
      const response = await fetch(apiUrl, {credentials: 'include'});
      const data = await response.json();
      setChecklists(
        data.checklists.filter(
          (item: Checklist) =>
            roleid === 'TECHNICIAN'
              ? item.technician?.trim().toLowerCase() === username.trim().toLowerCase()
              : true
        )
      );
      setLoading(false);
    };
    fetchChecklists();
  }, [username, roleid]);

 
const technicianBarData: any[] = [];
const technicianMap: { [key: string]: { moveIn: number; moveOut: number } } = {};

checklists.forEach(c => {
  if (c.technician) {
    if (!technicianMap[c.technician]) {
      technicianMap[c.technician] = { moveIn: 0, moveOut: 0 };
    }
    if (c.visitType?.toLowerCase() === 'move in') {
      technicianMap[c.technician].moveIn += 1;
    } else if (c.visitType?.toLowerCase() === 'move out') {
      technicianMap[c.technician].moveOut += 1;
    }
  }
});

Object.entries(technicianMap).forEach(([technician, counts]) => {
  technicianBarData.push({
    technician,
    moveIn: counts.moveIn,
    moveOut: counts.moveOut,
  });
});

if (loading) {
  return <PageLoader />;
}

  return (
    <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 p-6 dark:bg-gray-800">
      {/* 1st row: Report Table (left), Graph (right) */}
      <div className="bg-white rounded shadow border border-gray-200 p-4 flex flex-col justify-center xl:col-span-1 md:col-span-1 col-span-1 dark:bg-gray-800">
        <h2 className="text-lg font-bold mb-15">Move In / Move Out Graph</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={110}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* 2nd row: Assigned Works Table (left), Tools & Materials (right) */}
      <div className="bg-white rounded shadow border border-gray-200 p-4 flex flex-col justify-center xl:col-span-2 md:col-span-1 col-span-1 dark:bg-gray-800">
  <h2 className="text-lg font-bold mb-8 text-center">Reports by Technician</h2>
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={technicianBarData}>
      <XAxis dataKey="technician" tick={{ fontSize: 12 }} />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="moveIn" fill="#28a745" name="Move In" />
      <Bar dataKey="moveOut" fill="#dc3545" name="Move Out" />
    </BarChart>
  </ResponsiveContainer>
  <div className="mt-4 text-md font-semibold text-gray-700 text-center">
    Total Reports: {checklists.length}
  </div>
      </div>
        <div className="bg-white rounded shadow border border-gray-200 p-4 flex flex-col xl:col-span-3 md:col-span-2 col-span-1 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Daily Move In / Move Out</h2>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={barFilter} 
            onChange={e => setBarFilter(e.target.value)}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="moveIn" fill="#28a745" name="Move In" />
            <Bar dataKey="moveOut" fill="#dc3545" name="Move Out" />
          </BarChart>
        </ResponsiveContainer>
      </div>
     
    </div>
  );
}