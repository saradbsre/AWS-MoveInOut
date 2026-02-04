import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

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
    const filtered = [];
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
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/checklistshistory`;
      const response = await fetch(apiUrl);
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

 
const buildingCounts: { [key: string]: number } = {};
checklists.forEach(c => {
  if (c.building) {
    buildingCounts[c.building] = (buildingCounts[c.building] || 0) + 1;
  }
});
const buildingPieData = Object.entries(buildingCounts).map(([name, value]) => ({
  name,
  value,
}));

  return (
    <div className="grid xl:grid-cols-3 xl:grid-rows-2 md:grid-cols-2 md:grid-rows-3 grid-cols-1 gap-6 p-6  dark:bg-gray-800">
      {/* 1st row: Report Table (left), Graph (right) */}
      <div className="bg-white rounded shadow  border border-gray-200 p-4 xl:col-span-2 xl:row-span-1 md:col-span-2 md:row-span-1 col-span-1  dark:bg-gray-800">
        <h2 className="text-lg font-bold mb-2">Reports</h2>
        <div
          className="overflow-x-auto shadow-md rounded-lg  dark:bg-gray-800"
          style={{ maxHeight: '320px' }} // Adjust for 6 rows
        >
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none">Reference #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none">Building</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none">Unit</th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none">Contract No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none">End Date</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center border border-gray-300">
                    Loading checklist data...
                  </td>
                </tr>
              ) : checklists.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center border border-gray-300">
                    No checklists found
                  </td>
                </tr>
              ) : (
                checklists.map((checklist, idx) => (
                  <tr key={checklist.id}  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">{checklist.submissionDate?.slice(0, 10)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {checklist.visitType?.toLowerCase() === 'move out' ? (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">Move Out</span>
                      ) : checklist.visitType?.toLowerCase() === 'move in' ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Move In</span>
                      ) : (
                        checklist.visitType
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{checklist.refNum}</td>
                    <td className="px-6 py-4 whitespace-nowrap ">{checklist.tenant}</td>
                    <td className="px-6 py-4 whitespace-nowrap ">{checklist.building}</td>
                    <td className="px-6 py-4 whitespace-nowrap ">{checklist.unit}</td>
                    {/* <td className="px-6 py-4 whitespace-nowrap ">{checklist.contractNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap ">{checklist.startDate?.slice(0, 10)}</td>
                    <td className="px-6 py-4 whitespace-nowrap ">{checklist.endDate?.slice(0, 10)}</td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-white rounded shadow  border border-gray-200 p-4 flex flex-col  justify-center  xl:col-span-1 xl:row-span-1 md:col-span-1 md:row-span-1 col-span-1  dark:bg-gray-800">
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
       <div className="bg-white rounded shadow  border border-gray-200 p-4 flex flex-col  justify-center xl:col-span-1 xl:row-span-1 md:col-span-1 md:row-span-1 col-span-1  dark:bg-gray-800">
  <h2 className="text-lg font-bold mb-8 ">Reports by Building</h2>
  <ResponsiveContainer width="100%" height={250}>
    <PieChart>
      <Pie
        data={buildingPieData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={110}
        label={false}
      >
        {buildingPieData.map((entry, index) => {
          // Generate a light random color
          const randomLightColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 85%)`;
          return <Cell key={`cell-building-${index}`} fill={randomLightColor} />;
        })}
      </Pie>
      <Tooltip />
      {/* No Legend */}
    </PieChart>
  </ResponsiveContainer>
  <div className="mt-4 text-md font-semibold text-gray-700 text-center">
    Total Reports: {checklists.length}
  </div>
</div>
        <div className="bg-white rounded shadow  border border-gray-200 p-4  xl:col-span-2 xl:row-span-1 md:col-span-2 md:row-span-1 col-span-1 flex flex-col  dark:bg-gray-800">
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
      {/* <div className="bg-white rounded shadow p-4 flex flex-col items-center justify-center col-span-1 row-span-1">
  <h2 className="text-lg font-bold mb-4 text-center">Reports by Building</h2>
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={buildingPieData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={110}
        label={false}
      >
        {buildingPieData.map((entry, index) => {
          
          const randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
          return <Cell key={`cell-building-${index}`} fill={randomColor} />;
        })}
      </Pie>
      <Tooltip />
     
    </PieChart>
  </ResponsiveContainer>
      </div> */}
    </div>
  );
}