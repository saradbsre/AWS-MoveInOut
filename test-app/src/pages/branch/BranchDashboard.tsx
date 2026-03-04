import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
import { getComplaints } from '../../services/Transaction/Contract/Contractapi';

interface Complaint {
  complaint_id: string;
  complaintNum: string;
  Date: string;
  build_desc: string;
  status: string;
}

export default function BranchDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     const fetchComplaints = async () => {
       setLoading(true);
       const result = await getComplaints();
       // Map API fields to table fields for consistency
       setComplaints(
         (result.complaints || []).map((item: any) => ({
           complaint_id: item.complaint_id?.toString() ?? '',
           complaintNum: item.complaintNum ?? '',
           Date: item.Date ?? '',
           build_desc: item.build_desc ?? '',
           block: item.block ?? '',
           floor: item.floor_no ?? '',
           place: item.accessArea ?? '',
           unit: item.unit_desc ?? '',
           description: item.description ?? '',
           status: item.status ?? '',
           type: item.type ?? '',
           complaintDetails: item.complaintDetails || [],
         }))
       );
       setLoading(false);
     };
     fetchComplaints();
   }, []);

  // Prepare data for graphs
  // 1. Date-wise
  const dateCounts: Record<string, number> = {};
  complaints.forEach(c => {
    const date = c.Date?.slice(0, 10) || 'Unknown';
    dateCounts[date] = (dateCounts[date] || 0) + 1;
  });
  const dateBarData = {
    labels: Object.keys(dateCounts),
    datasets: [
      {
        label: 'Complaints by Date',
        data: Object.values(dateCounts),
        backgroundColor: 'rgba(59,130,246,0.7)',
      },
    ],
  };

  // 2. Building-wise (labels are just numbers, tooltips show building names)
  const buildingCounts: Record<string, number> = {};
  complaints.forEach(c => {
    const building = c.build_desc || 'Unknown';
    buildingCounts[building] = (buildingCounts[building] || 0) + 1;
  });
  const buildingNames = Object.keys(buildingCounts);
  const buildingBarData = {
    labels: buildingNames.map((_, idx) => `#${idx + 1}`),
    datasets: [
      {
        label: 'Complaints by Building',
        data: Object.values(buildingCounts),
        backgroundColor: 'rgba(16,185,129,0.7)',
      },
    ],
  };
  const buildingBarOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          title: (tooltipItems: any) => {
            const idx = tooltipItems[0].dataIndex;
            return buildingNames[idx] || '';
          },
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
      x: { title: { display: true, text: 'Building #' } },
    },
  };

  // 3. Status-wise
  const statusCounts: Record<string, number> = {};
  complaints.forEach(c => {
    const status = c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase() : 'Pending';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  const statusBarData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: 'Complaints by Status',
        data: Object.values(statusCounts),
        backgroundColor: [
          'rgba(251,191,36,0.7)',   // yellow for Pending
          'rgba(59,130,246,0.7)',   // blue for Assigned
          'rgba(16,185,129,0.7)',   // green for Completed
          'rgba(251,113,133,0.7)',  // red for Rejected/Other
        ],
      },
    ],
  };

  // Graph options
  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  return (
    <div className="p-4 dark:bg-gray-800">
      {/* Complaints Table: Full Row */}
      <div className="mb-6">
        <div className="bg-white rounded shadow border border-gray-200 p-4 dark:bg-gray-800">
          <div className="text-lg font-semibold mb-4">Complaints</div>
          <div className="overflow-x-auto shadow-md rounded-lg" style={{ maxHeight: 350}}>
            <table className="min-w-full bg-white dark:bg-gray-800">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300" style={{ minWidth: 60 }}>SNo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300" style={{ minWidth: 120 }}>Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300" style={{ minWidth: 220 }}>Complaint Num</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300" style={{ minWidth: 350 }}>Building</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300" style={{ minWidth: 120 }}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      Loading complaint data...
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      No complaints found
                    </td>
                  </tr>
                ) : (
                  complaints.map((c, idx) => (
                    <tr key={c.complaint_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <td className="px-4 py-4">{idx + 1}</td>
                      <td className="px-4 py-4">{c.Date ? c.Date.slice(0, 10) : ''}</td>
                      <td className="px-4 py-4">{c.complaintNum}</td>
                      <td className="px-4 py-4">{c.build_desc}</td>
                      <td className="px-4 py-4">{c.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Second Row: 3 Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded shadow border border-gray-200 p-4 dark:bg-gray-800">
          <div className="text-base font-semibold mb-4">Complaints by Date</div>
          <Bar data={dateBarData} options={barOptions} />
        </div>
        <div className="bg-white rounded shadow border border-gray-200 p-4 dark:bg-gray-800">
          <div className="text-base font-semibold mb-4">Complaints by Building</div>
          <Bar data={buildingBarData} options={buildingBarOptions} />
        </div>
        <div className="bg-white rounded shadow border border-gray-200 p-4 dark:bg-gray-800">
          <div className="text-base font-semibold mb-4">Complaints by Status</div>
          <Bar data={statusBarData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}