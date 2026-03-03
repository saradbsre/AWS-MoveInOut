import { useState, useEffect} from 'react';
import ReportHeader from '@/assets/bsreheader.png'
import '@/styles/ChecklistHistory.css'
import PageLoader from '@/components/PageLoader';
import EstimationCost from './EstimationCost';

interface EquipmentItem {
  id: string;
  itemno: string;
  itemname: string;
  unit: string;
  qty: number;
  status: "good" | "not working";
  remarks: string;
}

interface ChecklistItem {
  refNum: string;
  id: string;
  userid: string;
  submissionDate: string;
  visitType: string;
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
  Srno?: number;
  Trno?: number;
  authLevel?: number;
  authStatus?: string;
  preparedBy?: string;
  verifiedBy?: string;
  approvedBy?: string;
  RejectionRemark?: string;
}

export default function EstimationReport() {
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistItem | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterTechnician, setFilterTechnician] = useState('');
  const [filterContractNo, setFilterContractNo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [sortColumn, setSortColumn] = useState<string>('submissionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('0');
  const username = sessionStorage.getItem('username') || '';
  const roleid = sessionStorage.getItem('role');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [tempFilterStatus, setTempFilterStatus] = useState<string>('0');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setIsSearching(true);
    setCurrentPage(1);
    
    if (tempFilterStatus === filterStatus && hasSearched) {
      fetchChecklistsByStatus(tempFilterStatus).finally(() => {
        setIsSearching(false);
      });
    } else {
      setHasSearched(true);
      setFilterStatus(tempFilterStatus);
    }
  };

  const fetchChecklistsByStatus = async (status: string) => {
    setLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/checklists-by-status?status=${status}`;
      const response = await fetch(apiUrl, { credentials: 'include' });
      const data = await response.json();
      
      setChecklists(
        data.checklists.map((item: any) => ({
          ...item,
          id: item.id || item._id?.toString(),
          equipment: typeof item.equipment === 'string' ? JSON.parse(item.equipment) : item.equipment || [],
        }))
      );
    } catch (error) {
      console.error('Error fetching checklists:', error);
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (checklist: ChecklistItem) => {
    if (checklist.Srno) {
      setLoadingDetails(true);
      try {
        const apiUrl = `${import.meta.env.VITE_API_URL}/api/estimation-cost/${checklist.Srno}`;
        const response = await fetch(apiUrl, { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
          const fullChecklist = {
            ...checklist,
            Trno: data.header.trno,
            equipment: data.equipment || [],
            authLevel: data.header.authLevel,
            authStatus: data.header.authStatus,
            preparedBy: data.header.preparedBy,
            verifiedBy: data.header.verifiedBy,
            approvedBy: data.header.approvedBy,
            Srno: data.header.srno,
            RejectionRemark: data.header.remarks || ''
          };
          setSelectedChecklist(fullChecklist);
        } else {
          console.error('Failed to fetch estimation details');
          alert('Failed to load estimation details');
        }
      } catch (error) {
        console.error('Error fetching estimation details:', error);
        alert('Error loading estimation details');
      } finally {
        setLoadingDetails(false);
      }
    } else {
      setSelectedChecklist(checklist);
    }
  };
  
  const filteredChecklists = checklists
    .filter(item => {
      if (roleid === 'TECHNICIAN' && username) {
        return item.technician.trim().toLowerCase() === username.trim().toLowerCase();
      }
      return true;
    })
    .filter(item => {
      if (filterDate) {
        const itemDate = item.submissionDate.slice(0, 10);
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
        aValue = (aValue as string) || '';
        bValue = (bValue as string) || '';
        const direction = sortDirection === 'asc' ? 1 : -1;
        return direction * aValue.localeCompare(bValue);
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const direction = sortDirection === 'asc' ? 1 : -1;
        return direction * aValue.localeCompare(bValue);
      }
      return 0;
    });

  const paginatedChecklists = filteredChecklists.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (!hasSearched) return;
    
    const fetchData = async () => {
      await fetchChecklistsByStatus(filterStatus);
      setIsSearching(false);
    };
    fetchData();
  }, [filterStatus, hasSearched]);
  
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredChecklists.length / itemsPerPage));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredChecklists.length]);

  if (selectedChecklist) {
    return (
      <EstimationCost
        EstimationCostData={{
          technician: selectedChecklist.technician,
          building: selectedChecklist.building,
          unit: selectedChecklist.unit,
          tenant: selectedChecklist.tenant,
          contractNo: selectedChecklist.contractNo,
          startDate: selectedChecklist.startDate,
          endDate: selectedChecklist.endDate,
          visitType: selectedChecklist.visitType,
          equipment: selectedChecklist.equipment,
          Reference: selectedChecklist.refNum,
          Srno: selectedChecklist.Srno,
          Trno: selectedChecklist.Trno,
          authLevel: selectedChecklist.authLevel,
          authStatus: selectedChecklist.authStatus,
          preparedBy: selectedChecklist.preparedBy,
          verifiedBy: selectedChecklist.verifiedBy,
          approvedBy: selectedChecklist.approvedBy,
          RejectionRemark: selectedChecklist.RejectionRemark,
        }}
        onNewChecklist={() => setSelectedChecklist(null)}
        fromHistory={true}
      />
    );
  }

  if (loadingDetails) {
    return <PageLoader />;
  }
  
  return (
    <>
      <div className="container mx-auto p-4 dark:bg-gray-800">
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-bold mb-4">Filter</h2>
              
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

              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={() => {
                    setFilterDate('');
                    setFilterBuilding('');
                    setFilterUnit('');
                    setFilterTechnician('');
                    setFilterContractNo('');
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
          <h1 className="text-2xl font-bold">Estimation Cost Report</h1>
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-2">Filter by Status</label>
          <div className="flex gap-2 items-center">
            <select 
              className="border rounded px-3 py-2 w-64"
              value={tempFilterStatus}
              onChange={(e) => setTempFilterStatus(e.target.value)}
              disabled={isSearching}
            >
              <option value="0">All</option>
              <option value="1">Pending Verification</option>
              <option value="3">Rejected for Verification</option>
              <option value="2">Pending Approval</option>
              <option value="4">Approved</option>
              <option value="5">Rejected for Approval</option>
            </select>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setShowFilterModal(true)}
            >
              Filter
            </button>            
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

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
                  Reference # {sortColumn === 'refNum' && (sortDirection === 'asc' ? '▲' : '▼')}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    Loading checklist data...
                  </td>
                </tr>
              ) : paginatedChecklists.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    No checklists found
                  </td>
                </tr>
              ) : (
                paginatedChecklists.map(checklist => (
                  <tr key={checklist.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => handleRowClick(checklist)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {checklist.submissionDate ? checklist.submissionDate.slice(0, 10) : ''}
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
   
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            className="px-3 py-1 rounded bg-gray-200"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {Math.max(1, Math.ceil(filteredChecklists.length / itemsPerPage))}
          </span>
          <button
            className="px-3 py-1 rounded bg-gray-200"
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage >= Math.ceil(filteredChecklists.length / itemsPerPage)}
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
                <th className="px-1 py-1 border border-black text-xs font-bold text-black">Reference #</th>
                <th className="px-1 py-1 border border-black text-xs font-bold text-black w-40">Tenant</th>
                <th className="px-1 py-1 border border-black text-xs font-bold text-black w-40">Building</th>
                <th className="px-1 py-1 border border-black text-xs font-bold text-black">Unit</th>
                <th className="px-1 py-1 border border-black text-xs font-bold text-black">Contract No</th>
              </tr>
            </thead>
            <tbody>
              {filteredChecklists.map((checklist, idx) => (
                <tr key={checklist.id}>
                  <td className="px-1 py-1 border border-black text-xs text-black text-center">{idx + 1}</td>
                  <td className="px-1 py-1 border border-black text-xs text-black whitespace-nowrap">{checklist.submissionDate?.slice(0, 10)}</td>
                  <td className="px-1 py-1 border border-black text-xs text-black text-nowrap">{checklist.visitType}</td>
                  <td className="px-1 py-1 border border-black text-xs text-black text-nowrap">{checklist.refNum}</td>
                  <td className="px-1 py-1 border border-black text-xs text-black w-40">{checklist.tenant}</td>
                  <td className="px-1 py-1 border border-black text-xs text-black w-40">{checklist.building}</td>
                  <td className="px-1 py-1 border border-black text-xs text-black text-center text-nowrap">{checklist.unit}</td>
                  <td className="px-1 py-1 border border-black text-xs text-black text-center">{checklist.contractNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div> 
    </>
  );
}