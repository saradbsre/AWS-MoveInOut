import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
import ComplaintReportView from './ComplaintReportView';
import { formatDateTimeLong } from '@/utils/DateFormat';
interface TenantDetails {
    CTenantName: string;
    both: string;
    build_desc?: string;
    unit_desc?: string;
    contract_id?: string;
    contract_sdate?: string;
    contract_edate?: string;
    tena_city?: string;
    tena_email?: string;
    tena_mobile?: string;
}

interface ComplaintImage {
  url: string;
  [key: string]: any; // for any other properties
}

interface ComplaintReportData {
  building: string;
  unit: string;
  tenant: string;
  contractNo: string;
  startDate: string;
  endDate: string;
  submissionDate: string;
  description: string;
  images: (File | string | ComplaintImage)[];
  videos: (File | string | ComplaintImage)[];
  username: string;
  status: string;
  equipment: {
    roomType?: string;
    category?: string;
    equipment: string;
    remarks: string;
  }[];
  both: string;
  build_id: string;
  unit_desc: string;
  referenceNumber: string;
}
export default function TenantDashboard() {
    const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [complaints, setComplaints] = useState<any[]>([]);
    const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
    const [contracts, setContracts] = useState<any[]>([]);
    const [selectedContract, setSelectedContract] = useState<any | null>(null);
    const [complaintData, setComplaintData] = useState<ComplaintReportData | null>(null);

    useEffect(() => {
        const username = localStorage.getItem('tenantName') || sessionStorage.getItem('tenantName');
        if (!username) {
            setLoading(false);
            return;
        }
        axios
            .get(`${import.meta.env.VITE_API_URL}/api/tenant-details/${encodeURIComponent(username)}`)
            .then(res => setTenantDetails(res.data))
            .catch(() => setTenantDetails(null))
            .finally(() => setLoading(false));

        // axios
        //     .get(`${import.meta.env.VITE_API_URL}/api/complaints?tenant=${encodeURIComponent(username)}`)
        //     .then(res => setComplaints(res.data))
        //     .catch(() => setComplaints([]));

        axios
  .get(`${import.meta.env.VITE_API_URL}/api/complaints?tenant=${encodeURIComponent(username)}`)
  .then(res => {
    setComplaints(
      res.data.map((c: any) => ({
        ...c,
        images: (c.files || []).filter((f: any) => f.file_type === 'image').map((f: any) => f.url),
        videos: (c.files || []).filter((f: any) => f.file_type === 'video').map((f: any) => f.url),
      }))
    );
  })
  .catch(() => setComplaints([]));

        const contractsStr = sessionStorage.getItem('tenantContracts');
        if (contractsStr) {
            const contractsArr = JSON.parse(contractsStr);
            setContracts(contractsArr);
            setSelectedContract(contractsArr[0] || null); // Default to first contract
        }
    }, []);

    function StatusBadge({ status }: { status: string }) {
        let color = "bg-yellow-100 text-yellow-800 border-yellow-300";
        if (status === "completed") color = "bg-green-100 text-green-800 border-green-300";
        else if (status === "assigned") color = "bg-blue-100 text-blue-800 border-blue-300";
        else if (status === "pending") color = "bg-orange-100 text-orange-800 border-orange-300";
        return (
            <span className={`px-2 py-1 rounded-full text-xs border font-semibold ${color}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    }

    const sortedComplaints = [...complaints].sort((a, b) =>
        new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
    );
    const categoryCounts: Record<string, number> = {};
    complaints.forEach(c => {
        const cat = c.equipment?.[0]?.category || 'Uncategorized';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const barData = {
        labels: Object.keys(categoryCounts),
        datasets: [
            {
                label: 'Complaints by Category',
                data: Object.values(categoryCounts),
                backgroundColor: 'rgba(59,130,246,0.7)', // blue-500
            },
        ],
    };
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

    // Count complaints per unit
    const unitCounts: Record<string, number> = {};
    complaints.forEach(c => {
        const unit = c.unit || 'Unknown Unit';
        unitCounts[unit] = (unitCounts[unit] || 0) + 1;
    });
    const unitBarData = {
        labels: Object.keys(unitCounts),
        datasets: [
            {
                label: 'Complaints by Unit',
                data: Object.values(unitCounts),
                backgroundColor: 'rgba(16,185,129,0.7)', // green-500
            },
        ],
    };
    const unitBarOptions = {
        indexAxis: 'y', // <-- horizontal bars
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
        },
        scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
    };

    // Count complaints per status
    const statusCounts: Record<string, number> = {};
    complaints.forEach(c => {
        const status = c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Pending';
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
    const statusBarOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
        },
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
    };

      const username = sessionStorage.getItem('username') || 'User';
      const printRef = useRef<HTMLDivElement>(null);
      
      function createPageFooter(): void {
        // Remove any existing footer elements and styles
        const existingFooters = document.querySelectorAll('.dynamic-page-footer');
        const existingStyles = document.querySelectorAll('style[data-footer-style]');
        existingFooters.forEach(footer => footer.remove());
        existingStyles.forEach(style => style.remove());
      
        // Create CSS for footer with better browser compatibility
      const style = document.createElement('style');
        style.setAttribute('data-footer-style', 'true');
        style.textContent = 
         `@media print {
            @page {
              @bottom-left {
                content: "Printed By: ${username} ${formatDateTimeLong(new Date())}";
                font-size: 10px;
                font-family: "Times New Roman", serif;
                color: black;
                background: white;
              }
              @bottom-right {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 10px;
                font-family: "Times New Roman", serif;
                color: black;
                background: white;
              }      
              body { 
                counter-reset: page; 
              }
            }
          }`;
      document.head.appendChild(style);
      }

     const handlePrint = () => {
  // Create dynamic footer
  // injectPrintSignatureFooter();
  createPageFooter(); 
  // Small delay to ensure footer is rendered
  setTimeout(() => {
    window.print(); 
    // Clean up after printing
  setTimeout(() => {
    const footers = document.querySelectorAll('.dynamic-page-footer');
      footers.forEach(footer => footer.remove());
  }, 1000);
  }, 100);
};

if (selectedComplaint) {
        return (
            <ComplaintReportView
                data={selectedComplaint}
                view="Disabled"
                onBack={() => setSelectedComplaint(null)}
            />
        );
    }

    return (
        <>
        <div>
         <div className="grid xl:grid-cols-2 xl:grid-rows-2 md:grid-cols-2 md:grid-rows-2 grid-cols-1 gap-6 p-2  dark:bg-gray-800">
            {/* Personal Information Card */}
            <div className="bg-white rounded shadow  border border-gray-200 p-4 xl:col-span-1 xl:row-span-1 md:col-span-1 md:row-span-1 col-span-1  dark:bg-gray-800">
                <div className="text-base sm:text-lg lg:text-xl md:text-lg font-semibold mb-4">Personal Information</div>
                {loading ? (
                    <div>Loading tenant details...</div>
                ) : tenantDetails ? (
                    <div className="space-y-4 text-xs sm:text-sm lg:text-xl md:text-sm dark:bg-gray-800">
                        <div className="flex items-center bg-gray-50 rounded-lg px-2 py-2  dark:bg-gray-800">
                            <span className="mr-3 text-gray-500">
                                {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg> */}
                            </span>
                            <span className="font-medium flex-1">User ID</span>
                            <span className="text-gray-700 dark:text-white">{tenantDetails.both}</span>
                        </div>
                        <div className="flex items-center bg-gray-50 rounded-lg px-2 py-2 dark:bg-gray-800">
                            <span className="mr-3 text-gray-500">
                                {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth={2} />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                                </svg> */}
                            </span>
                            <span className="font-medium flex-1"> Name</span>
                            <span className="text-gray-700 dark:text-white md:text-sm ">{tenantDetails.CTenantName}</span>
                        </div>
                        <div className="flex items-center bg-gray-50 rounded-lg px-2 py-2 dark:bg-gray-800">
                            <span className="mr-3 text-gray-500">
                                {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 01-8 0 4 4 0 018 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7m0 0H9m3 0h3" />
                                </svg> */}
                            </span>
                            <span className="font-medium flex-1">Email</span>
                            <span className="text-gray-700 dark:text-white">{tenantDetails.tena_email}</span>
                        </div>
                        <div className="flex items-center bg-gray-50 rounded-lg px-2 py-2 dark:bg-gray-800 ">
                            <span className="mr-3 text-gray-500">
                                {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h2l.4 2M7 13h10l4-8H5.4" />
                                    <circle cx="7" cy="21" r="2" />
                                    <circle cx="17" cy="21" r="2" />
                                </svg> */}
                            </span>
                            <span className="font-medium flex-1">Mobile</span>
                            <span className="text-gray-700 dark:text-white">{tenantDetails.tena_mobile}</span>
                        </div>
                        <div className="flex items-center bg-gray-50 rounded-lg px-2 py-2 dark:bg-gray-800">
                            <span className="mr-3 text-gray-500">
                                {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg> */}
                            </span>
                            <span className="font-medium flex-1">City</span>
                            <span className="text-gray-700 dark:text-white">{tenantDetails.tena_city}</span>
                        </div>
                    </div>
                ) : (
                    <div>No tenant details found.</div>
                )}
            </div>
            {/* Contract Information Card */}
            <div className="bg-white rounded shadow  border border-gray-200 pt-1 pb-4 px-4 flex flex-col  justify-center xl:col-span-1 xl:row-span-1 md:col-span-1 md:row-span-1 col-span-1  dark:bg-gray-800">
                <div className="flex items-center bg-gray-50 rounded-lg px-2 py-1 text-xs sm:text-sm md:text-base dark:bg-gray-800">
                    <span className="font-medium flex-1  ">Unit id</span>
                    <select
                        className="border rounded px-2 py-1 text-2xs sm:text-sm md:text-base"
                        value={
                            selectedContract
                                ? `${selectedContract.contract_id} ${selectedContract.build_desc} ${selectedContract.unit_desc}`
                                : ''
                        }
                        onChange={e => {
                            const contract = contracts.find(
                                c =>
                                    `${c.contract_id} ${c.build_desc} ${c.unit_desc}` === e.target.value
                            );
                            setSelectedContract(contract);
                        }}
                    >
                        {contracts.map((c, idx) => (
                            <option
                                key={idx}
                                value={`${c.contract_id} ${c.build_desc} ${c.unit_desc}`}
                            >
                                {c.contract_id} {c.build_desc} {c.unit_desc}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="text-base sm:text-lg lg:text-xl font-semibold mb-4 dark:bg-gray-800">Contract Information</div>
                {loading ? (
                    <div>Loading contract details...</div>
                ) : selectedContract ? (
                    <div className="space-y-4 text-xs sm:text-sm lg:text-xl md:text-base dark:bg-gray-800">
                        <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2  dark:bg-gray-800">
                            <span className="font-medium flex-1">Building</span>
                            <span className="text-gray-700 dark:text-white">{selectedContract.build_desc}</span>
                        </div>
                        <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2 dark:bg-gray-800">
                            <span className="font-medium flex-1">Unit</span>
                            <span className="text-gray-700 dark:text-white">{selectedContract.unit_desc}</span>
                        </div>
                        <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2 dark:bg-gray-800">
                            <span className="font-medium flex-1">Contract Number</span>
                            <span className="text-gray-700 dark:text-white">{selectedContract.contract_id}</span>
                        </div>
                        <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2 dark:bg-gray-800">
                            <span className="font-medium flex-1">Contract Start Date</span>
                            <span className="text-gray-700 dark:text-white">{selectedContract.contract_sdate?.slice(0, 10)}</span>
                        </div>
                        <div className="flex items-center bg-gray-50 rounded-lg px-4 py-2 dark:bg-gray-800">
                            <span className="font-medium flex-1">Contract End Date</span>
                            <span className="text-gray-700 dark:text-white">{selectedContract.contract_edate?.slice(0, 10)}</span>
                        </div>
                    </div>
                ) : (
                    <div>No contract details found.</div>
                )}
            </div>
            <div className="bg-white rounded shadow border border-gray-200 p-4 flex flex-col justify-center xl:col-span-2 xl:row-span-1 md:col-span-2 md:row-span-1 col-span-1  dark:bg-gray-800">
                <div className="text-base sm:text-lg lg:text-xl font-semibold mb-4">My Complaints</div>
                <div className="overflow-x-auto" style={{ maxHeight: '350px' }}>
                    <table className="min-w-full text-xs sm:text-sm lg:text-xl md:text-base">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left">Date</th>
                                <th className="px-6 py-3 text-left">Reference No.</th>
                                <th className="px-6 py-3 text-left">Building</th>
                                <th className="px-6 py-3 text-left">Unit</th>
                                <th className="px-6 py-3 text-left">Room Type</th>
                                <th className="px-6 py-3 text-left">Equipment</th>
                                <th className="px-6 py-3 text-left">Status</th>
                                {/* <th className="px-6 py-3 text-left">Action</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedComplaints.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-4 text-gray-500">No complaints found.</td>
                                </tr>
                            ) : (
                                sortedComplaints.map((c, idx) => (
                                    <tr key={idx} className="border-b dark:border-gray-700 cursor-pointer"
                                    onClick={() => setSelectedComplaint(c)}>
                                        <td className="px-6 py-3 whitespace-nowrap">{c.submissionDate ? c.submissionDate.slice(0, 10) : ''}</td>
                                        <td className="px-6 py-3 whitespace-nowrap">{c.referenceNumber}</td>
                                        <td className="px-6 py-3 whitespace-nowrap">{c.building}</td>
                                        <td className="px-6 py-3 whitespace-nowrap">{c.unit}</td>
                                        <td className="px-6 py-3 whitespace-nowrap">{c.equipment?.[0]?.roomType || ''}</td>
                                        <td className="px-6 py-3 whitespace-nowrap">{c.equipment?.[0]?.equipment || ''}</td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <StatusBadge status={c.status || 'pending'} />
                                        </td>
                                        {/* <td className="px-6 py-3 whitespace-nowrap">
                                            <button
                                                className="border border-gray-400 rounded px-3 py-1 bg-white hover:bg-gray-100 text-sm"
                                                 onClick={() => setSelectedComplaint(c)}
                                            >
                                                Print
                                            </button>
                                        </td> */}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                  
                </div>

            </div>
            </div>
            <div className="grid xl:grid-cols-3  md:grid-cols-3  grid-cols-1 gap-6 p-2  dark:bg-gray-800">
            <div className="bg-white rounded shadow  border border-gray-200 p-4 xl:col-span-1 xl:row-span-1 md:col-span-1 md:row-span-1 col-span-1 flex flex-col  dark:bg-gray-800">
                <div className="w-full">
                    <div className="text-base sm:text-lg font-semibold mb-4">Complaints by Category</div>
                    <Bar data={barData} options={barOptions} />
                </div>
            </div>
            <div className="bg-white rounded shadow  border border-gray-200 p-4 xl:col-span-1 xl:row-span-1 md:col-span-1 md:row-span-1 col-span-1 flex flex-col  dark:bg-gray-800 ">
                <div className="w-full">
                    <div className="text-base sm:text-lg font-semibold mb-4">Complaints by Unit</div>
                    <Bar data={unitBarData} options={unitBarOptions as any} />
                </div>
            </div>
            <div className="bg-white rounded shadow border border-gray-200 p-4 xl:col-span-1 xl:row-span-1 md:col-span-1 md:row-span-1 col-span-1 flex flex-col dark:bg-gray-800">
                <div className="w-full">
                    <div className="text-base sm:text-lg font-semibold mb-4">Complaints by Status</div>
                    <Bar data={statusBarData} options={statusBarOptions as any} />
                </div>
            </div>
         </div>
             
        </div>
        
         {/* {selectedComplaint && createPortal(
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 print-modal">
                            <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6 relative overflow-y-auto max-h-[90vh] print-container">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-5xl font-bold"
                                onClick={() => setSelectedComplaint(null)}
                                aria-label="Close"
                            >
                                &times;
                            </button>
                            <ComplaintReportView
                                data={selectedComplaint}
                                view="Disabled"
                              
                            />
                            </div>
                        </div>,
                        document.body
              )} */}
        </>    
    );
}