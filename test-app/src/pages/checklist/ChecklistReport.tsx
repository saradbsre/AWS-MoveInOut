import React, { useState, useEffect} from 'react';
import ReportView from '../moveinout/ReportView';
import ReportHeader from '@/assets/bsreheader.png'
// import { formatDateTimeLong } from '@/utils/DateFormat';
import { getChecklist } from '@/services/Transaction/Contract/Contractapi';
import '@/styles/ChecklistHistory.css'


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

interface EquipmentItem {
  id: string;
  itemno: string;
  itemname: string;
  unit: string;
  qty: number;
  status: "good" | "not working";
  remarks: string;
  brdcode: string; // Add this
  subcode: string; // Add this
  // Add any other fields required by SelectedItem
}
// Define interfaces for our data
interface ChecklistItem {
  files: never[];
  refNum: string;
  id: string;
  userid: string;
  submissionDate: Date;
  visitType: string; // "MOVE IN" or "MOVE OUT"
  building: string;
  unit: string;
  tenant: string;
  startDate: string;
  endDate: string; 
  contractNo: string;
  technician: string;
  equipment: EquipmentItem[];
  tenantSignature: string;
  technicianSignature: string;
  images: string[];
  videos: string[];
  Reference: string;
  unitNature: string;
  unitType: string;
  emirates: string;
}



export default function TenantReport() {
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistItem | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState<'row' | 'date'>('row');
  const [filterDate, setFilterDate] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterTechnician, setFilterTechnician] = useState('');
  const [filterContractNo, setFilterContractNo] = useState('');
  const [orderBy, setOrderBy] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 25;
  const [sortColumn, setSortColumn] = useState<string>('submissionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // function createPageFooter(): void {
  //   // Remove any existing footer elements and styles
  //   const existingFooters = document.querySelectorAll('.dynamic-page-footer');
  //   const existingStyles = document.querySelectorAll('style[data-footer-style]');
  //   existingFooters.forEach(footer => footer.remove());
  //   existingStyles.forEach(style => style.remove());
  // console.log('checklists:', checklists);
  // // Create CSS for footer with better browser compatibility
  // const style = document.createElement('style');
  //   style.setAttribute('data-footer-style', 'true');
  //   style.textContent = 
  //    `@media print {
  //       @page {
  //         @bottom-left {
  //           content: "Printed By: ${username} ${formatDateTimeLong(new Date())}";
  //           font-size: 10px;
  //           font-family: "Times New Roman", serif;
  //           color: black;
  //           background: white;
  //         }
  //         @bottom-right {
  //           content: "Page " counter(page) " of " counter(pages);
  //           font-size: 10px;
  //           font-family: "Times New Roman", serif;
  //           color: black;
  //           background: white;
  //         }      
  //         body { 
  //           counter-reset: page; 
  //         }
  //       }
  //     }`;
  // document.head.appendChild(style);
  // }
  // const handlePrintTable = () => {
  // // Create dynamic footer
  // // injectPrintSignatureFooter();
  // createPageFooter(); 
  // // Small delay to ensure footer is rendered
  // setTimeout(() => {
  //   window.print(); 
  //   // Clean up after printing
  // setTimeout(() => {
  //   const footers = document.querySelectorAll('.dynamic-page-footer');
  //     footers.forEach(footer => footer.remove());
  // }, 1000);
  // }, 100);
  // };
  
  const handleSort = (column: string) => {
  if (sortColumn === column) {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  } else {
    setSortColumn(column);
    setSortDirection('asc');
  }
  setCurrentPage(1);
  };
    const username = sessionStorage.getItem('username') || '';
      const roleid = sessionStorage.getItem('role') || '';
 useEffect(() => {
    
    const fetchChecklists = async () => {
      setLoading(true);
      const username = sessionStorage.getItem('username');
      if (!username) {
        setChecklists([]);
        // setTotal(0);
        setLoading(false);
        return;
      }
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/checklistshistory`;
      const response = await fetch(apiUrl, { credentials: 'include' });
      const data = await response.json();
      setChecklists(
        data.checklists.map((item: any) => ({
          ...item,
          equipment: item.equipment ? (typeof item.equipment === 'string' ? JSON.parse(item.equipment) : item.equipment) : [],
          files: item.files || []    // preserve files returned by backend
        }))
      );
      // setTotal(data.total);
      setLoading(false);
    };

    fetchChecklists();
  }, []);

 const filteredChecklists = checklists
 
  .filter(item => {
    if (filterDate) {
      const itemDate = item.submissionDate.toISOString().slice(0, 10);
      return itemDate === filterDate;
    }
    return true;
  })
  .filter(item => !filterBuilding || item.building.toLowerCase().includes(filterBuilding.toLowerCase()))
  .filter(item => !filterUnit || item.unit.toLowerCase().includes(filterUnit.toLowerCase()))
  .filter(item => !filterTechnician || item.technician.toLowerCase().includes(filterTechnician.toLowerCase()))
  .filter(item => !filterContractNo || item.contractNo.toLowerCase().includes(filterContractNo.toLowerCase()))
  .sort((a, b) => {
    let aValue = a[sortColumn as keyof ChecklistItem];
    let bValue = b[sortColumn as keyof ChecklistItem];

  if (sortColumn === 'submissionDate') {
    // Handle Date objects
    const aDate = aValue instanceof Date ? aValue : new Date(aValue as string);
    const bDate = bValue instanceof Date ? bValue : new Date(bValue as string);
    const direction = orderBy === 'asc' ? 1 : -1;
    return direction * (aDate.getTime() - bDate.getTime());
  }
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    const direction = sortDirection === 'asc' ? 1 : -1;
    return direction * aValue.localeCompare(bValue);
  }
    return 0;
  });
  
  const paginatedChecklists = checklists;

  useEffect(() => {
  const maxPage = Math.max(1, Math.ceil(filteredChecklists.length / itemsPerPage));
  if (currentPage > maxPage) {
    setCurrentPage(maxPage);
  }
}, [filteredChecklists.length]);
  if (selectedChecklist) {
    //console.log('Selected Checklist:', selectedChecklist);
    // console.log('Selected Checklist Equipment:', selectedChecklist.equipment);
    //  console.log('ReportView Props:', {
    //     reportData: selectedChecklist,
    //     selectedEquipment: selectedChecklist.equipment,
    //     onNewChecklist: () => setSelectedChecklist(null),
    //     fromHistory: true,
    //   })
    return (
      <ReportView
      reportData={selectedChecklist}
      selectedEquipment={selectedChecklist.equipment }
      onNewChecklist={() => setSelectedChecklist(null)}
      fromHistory={true}
      />
     
    );
  }

function groupByDate(items: ChecklistItem[]) {
  const groups: { [date: string]: ChecklistItem[] } = {};
  items.forEach(item => {
    const date = item.submissionDate.toISOString().slice(0, 10);
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
  });
  return groups;
}
  
return (
  <>
  <div className="container mx-auto p-4 dark:bg-gray-800">
    {showFilterModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-lg font-bold mb-4">Filter </h2>
          <div className="mb-4">
            <label className="block font-medium mb-1">Filter Type</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as 'row' | 'date')}
              className="w-full border rounded px-2 py-1"
            >
              <option value="row">By Row</option>
              <option value="date">By Date</option>
            </select>
          </div>
          
            <div className="mb-4">
              <label className="block font-medium mb-1">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </div>
         
          <div className="mb-4">
            <label className="block font-medium mb-1">Building</label>
            <input
              type="text"
              value={filterBuilding}
              onChange={e => setFilterBuilding(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Unit</label>
            <input
              type="text"
              value={filterUnit}
              onChange={e => setFilterUnit(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Technician</label>
            <input
              type="text"
              value={filterTechnician}
              onChange={e => setFilterTechnician(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Contract No.</label>
            <input
              type="text"
              value={filterContractNo}
              onChange={e => setFilterContractNo(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Order By</label>
            <select
              value={orderBy}
              onChange={e => setOrderBy(e.target.value as 'asc' | 'desc')}
              className="w-full border rounded px-2 py-1"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              onClick={() => {
                setFilterType('row');
                setFilterDate('');
                setFilterBuilding('');
                setFilterUnit('');
                setFilterTechnician('');
                setFilterContractNo('');
                setOrderBy('desc');
                setShowFilterModal(false);
                setCurrentPage(1);
              }}
            >
              Clear
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => {
                setShowFilterModal(false);
                setCurrentPage(1);
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Move In/Out Reports</h1>
      <div className="flex gap-2">

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setShowFilterModal(true)}
        >
          Filter
        </button>
      </div>
    </div>
    
    {filterType === 'date' ? (
      Object.entries(groupByDate(paginatedChecklists)).map(([date, items]) => (
        <div key={date} className="mb-8">
          <div className="text-lg font-bold mb-2">{date}</div>
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full bg-white dark:bg-gray-800">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                    onClick={() => handleSort('submissionDate')}
                  >
                    Date {sortColumn === 'submissionDate' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                    onClick={() => handleSort('visitType')}
                  >
                    Type {sortColumn === 'visitType' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                    onClick={() => handleSort('refNum')}
                  >
                     Reference Number {sortColumn === 'refNum' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                    onClick={() => handleSort('tenant')}
                  >
                    Tenant {sortColumn === 'tenant' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                    onClick={() => handleSort('building')}
                  >
                    Building {sortColumn === 'building' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                    onClick={() => handleSort('unit')}
                  >
                    Unit {sortColumn === 'unit' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 whitespace-nowrap cursor-pointer select-none"
                    onClick={() => handleSort('contractNo')}
                  >
                    Contract # {sortColumn === 'contractNo' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                   <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
              >
                Contract Start {sortColumn === 'contractStart' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
               <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
              >
                Contract End {sortColumn === 'contractEnd' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                    onClick={() => handleSort('technician')}
                  >
                    Technician {sortColumn === 'technician' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      Loading checklist data...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      No checklists found
                    </td>
                  </tr>
                ) : (
                  items.map(checklist => (
                    <tr
                      key={checklist.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => setSelectedChecklist(checklist)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {checklist.submissionDate ? checklist.submissionDate.toISOString().slice(0, 10) : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          checklist.visitType === 'Move In'
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                          {checklist.visitType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{checklist.refNum}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{checklist.tenant}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{checklist.building}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{checklist.unit}</td>                    
                      <td className="px-6 py-4 whitespace-nowrap">{checklist.contractNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                       {checklist.startDate ? checklist.startDate.slice(0, 10) : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                       {checklist.endDate ? checklist.endDate.slice(0, 10) : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{checklist.technician}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))
    ) : (
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                onClick={() => handleSort('submissionDate')}
              >
                Date {sortColumn === 'submissionDate' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                onClick={() => handleSort('visitType')}
              >
                Type {sortColumn === 'visitType' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
                <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                onClick={() => handleSort('refNum')}
              >
                Reference Number {sortColumn === 'refNum' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                onClick={() => handleSort('tenant')}
              >
                Tenant {sortColumn === 'tenant' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                onClick={() => handleSort('building')}
              >
                Building {sortColumn === 'building' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                onClick={() => handleSort('unit')}
              >
                Unit {sortColumn === 'unit' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 whitespace-nowrap cursor-pointer select-none"
                onClick={() => handleSort('contractNo')}
              >
                Contract # {sortColumn === 'contractNo' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
              >
                Contract Start {sortColumn === 'contractStart' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
               <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
              >
                Contract End {sortColumn === 'contractEnd' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 cursor-pointer select-none"
                onClick={() => handleSort('technician')}
              >
                Technician {sortColumn === 'technician' && (sortDirection === 'asc' ? '▲' : '▼')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center">
                  Loading checklist data...
                </td>
              </tr>
            ) : paginatedChecklists.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center">
                  No checklists found
                </td>
              </tr>
            ) : (
              paginatedChecklists.map(checklist => (
                <tr key={checklist.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => setSelectedChecklist(checklist)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {checklist.submissionDate ? checklist.submissionDate.toISOString().slice(0, 10) : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      checklist.visitType === 'Move In'
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    }`}>
                      {checklist.visitType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{checklist.refNum}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{checklist.tenant}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{checklist.building}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{checklist.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{checklist.contractNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                   {checklist.startDate ? checklist.startDate.slice(0, 10) : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                   {checklist.endDate ? checklist.endDate.slice(0, 10) : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{checklist.technician}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )}
    
  <div className="flex justify-center items-center gap-2 mt-4">
  <button
    className="px-3 py-1 rounded bg-gray-200"
    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
    disabled={currentPage === 1}
  >
    Prev
  </button>
  <span>
    Page {currentPage} of {totalPages}
  </span>
  <button
    className="px-3 py-1 rounded bg-gray-200"
    onClick={() => setCurrentPage(p => p + 1)}
    disabled={currentPage >= totalPages}
  >
    Next
  </button>
</div>
  </div>
     {/* Printable Table */}
  <div className="hidden print:block bg-white p-6 printable-table">
    <div className="w-full mb-6">
      <img 
        src={ReportHeader}
        alt="ABDULWAHED AHMAD RASHED BIN SHABIB Real Estate" 
        className="w-full h-auto object-contain"
      />
    </div>
    <h2 className="text-xl font-bold mb-4 text-black text-center">Tenant Status Reports</h2>
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-black bg-white">
        <thead>
          <tr>
            <th className="px-1 py-1 border border-black text-xs font-bold text-black">SN</th>
            <th className="px-2 py-1 border border-black text-xs font-bold text-black whitespace-nowrap">Date</th>
            <th className="px-1 py-1 border border-black text-xs font-bold text-black">Type</th>
            <th className="px-1 py-1 border border-black text-xs font-bold text-black">Reference No</th>
            <th className="px-1 py-1 border border-black text-xs font-bold text-black w-40">Tenant</th>
            <th className="px-1 py-1 border border-black text-xs font-bold text-black w-40">Building</th>
            <th className="px-1 py-1 border border-black text-xs font-bold text-black">Unit</th>
            <th className="px-1 py-1 border border-black text-xs font-bold text-black">Contract No</th>
            <th className="px-1 py-1 border border-black text-xs font-bold text-black">Start Date</th>
            <th className="px-1 py-1 border border-black text-xs font-bold text-black">End Date</th>
            <th className="px-1 py-1 border border-black text-xs font-bold text-black">Technician</th>
          </tr>
        </thead>
      <tbody>
      {filteredChecklists.map((checklist, idx) => (
        <tr key={checklist.id}>
          <td className="px-1 py-1 border border-black text-xs text-black text-center">{idx + 1}</td>
          <td className="px-1 py-1 border border-black text-xs text-black whitespace-nowrap">{checklist.submissionDate?.toISOString().slice(0, 10)}</td>
          <td className="px-1 py-1 border border-black text-xs text-black text-nowrap">{checklist.visitType}</td>
          <td className="px-1 py-1 border border-black text-xs text-black text-center">{checklist.refNum}</td>
          <td className="px-1 py-1 border border-black text-xs text-black w-40 ">{checklist.tenant}</td>
          <td className="px-1 py-1 border border-black text-xs text-black w-40 ">{checklist.buildingDesc}</td>
          <td className="px-1 py-1 border border-black text-xs text-black text-center text-nowrap">{checklist.unit}</td>
          <td className="px-1 py-1 border border-black text-xs text-black text-center">{checklist.contractNo}</td>
          <td className="px-1 py-1 border border-black text-xs text-black text-center">{checklist.startDate?.slice(0, 10)}</td>
          <td className="px-1 py-1 border border-black text-xs text-black text-center">{checklist.endDate?.slice(0, 10)}</td>
          <td className="px-1 py-1 border border-black text-xs text-black text-center">{checklist.technician}</td>
        </tr>
        ))}
      </tbody>
    </table>
    </div>
  </div> 
  </>
);
}
