import React, { useState, useEffect } from 'react';
import ReportView from '../moveinout/ReportView';
import ReportHeader from '@/assets/bsreheader.png';
import '@/styles/ChecklistHistory.css';
import { getComplaints, getComplaintDetails, deleteComplaintDetails } from '@/services/Transaction/Contract/Contractapi';
import { useNavigate,useLocation } from 'react-router-dom';
import { formatDateTimeLong } from '@/utils/DateFormat';
import CheckListView from './CheckListView';

// Extend ChecklistItem for complaint fields
interface ComplaintItem {
  id: string;
  refNum: string;
  submissionDate: string;
  building: string;
  unit?: string;
  block?: string;
  place?: string;
  description?: string;
  status?: string;
  assignedTo?: string;
  scheduledTime?: string;
  type: string; // 'indoor' or 'outdoor'
  category?: string; 
  remarks?: string;
  floor?: string; 
  accessArea?: string; 
  floor_no?: string;
  Aupdate?: number; 
  subComp_id?: string; 
  complaintDetails?: any[]; 
  CTenantName?: string; 
  contract_id?: string; 
  contract_sdate?: string; 
  contract_edate?: string; 
  place_desc?: string; 
  unitNature?: string; 
  unit_master_desc?: string; 
  Reference?: string;
  complaintNo?: string;
  tenant?: string;
  unit_desc?: string;
}

export default function BranchComplaintReport() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [orderBy, setOrderBy] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  //const [complaintType, setComplaintType] = useState<'indoor' | 'outdoor'>('indoor');
  const itemsPerPage = 25;
const location = useLocation();
const [viewType, setViewType] = useState<'branch' | 'detailed'>(
  location.state?.viewType === 'detailed' ? 'detailed' : 'branch'
);
const [complaintType, setComplaintType] = useState<'indoor' | 'outdoor'>(
  location.state?.complaintType === 'outdoor' ? 'outdoor' : 'indoor'
);

useEffect(() => {
  if (location.state?.viewType) setViewType(location.state.viewType);
  if (location.state?.complaintType) setComplaintType(location.state.complaintType);
}, [location.state]);
  const navigate = useNavigate();

  const [branchComplaints, setBranchComplaints] = useState<ComplaintItem[]>([]);
  const [showChecklistView, setShowChecklistView] = useState(false);
  const [checklistProps, setChecklistProps] = useState<any>(null);
  
  useEffect(() => {
  if (location.state?.viewType) {
    setViewType(location.state.viewType);
  }
}, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let data;
      if (viewType === 'branch') {
        const result = await getComplaints();
        // Map API fields to table fields
        //console.log("Raw API response for branch complaints:", result);
        data = (result.complaints || []).map((item: any) => ({
          id: item.complaint_id?.toString() ?? '',
          refNum: item.complaintNum ?? '',
          submissionDate: item.Date ?? '',
          building: item.build_desc ?? '',
          unit_desc: item.unit_desc ?? '',
          block: item.block ?? '',
          floor: item.floor_no ?? '',
          place: item.accessArea ?? '',
          description: item.description ?? '',
          status: item.status ?? '',
          assignedTo:  '',
          scheduledTime: '', // Add if you have this field
          type: item.type ?? '',
          complaintDetails: item.complaintDetails || [],
          complaintType: item.complaintType
        }));
       // console.log("Fetched branch complaints:", data);
      } else {
        const result = await getComplaintDetails('');
        //console.log("Raw API response for complaint details:", result);
        data = (result.complaintDetails || []).map((item: any) => ({
          id: item.complaint_id?.toString() ?? '',
          refNum: item.complaintNum ?? '',
          submissionDate: item.Date ?? '',
          building: Array.isArray(item.build_desc)
          ? [...new Set(item.build_desc)].join(', ')
          : (item.build_desc ?? ''),
          unit_desc: item.unit_desc ?? '',
          tenant: item.CTenantname ?? '',
          contractNo: item.contract_id ?? '',
          contract_sdate: item.contract_sdate ?? '',
          contract_edate: item.contract_edate ?? '',
           place_desc: item.place_desc ?? '',
           unitNature: item.unitNature ?? '',
           unit_master_desc: item.unit_master_desc ?? '',
          category: item.category ?? '',
          remarks: item.remarks ?? '', // Use remarks for detail
          status: item.status ?? '',
          assignedTo: item.assigned_to ?? '',
          scheduledTime: item.assigned_date ?? '',
          type: '', // Not present in complaintsDetail
          Aupdate: item.Aupdate ?? 0, // Add Aupdate field for sorting if needed
          counter: item.counter ?? '',
          items: item.items || [], // Add items array for checklist view
          techniciansignature: item.techniciansignature || '',
          tenantsignature: item.tenantsignature || '',
          build_id: item.build_id ?? '',
        }));
        //console.log("Fetched complaint details now:", data);
      }
      setComplaints(data);
      setLoading(false);
    };
    fetchData();
  }, [viewType]);

  // Filtering
  const filteredComplaints = complaints
    .filter(item =>
      viewType === 'branch'
        ? item.type === complaintType
        : true // skip type filter for detailed view
    )
    .filter(item => !filterDate || item.submissionDate?.slice(0, 10) === filterDate)
    .filter(item => !filterBuilding || item.building?.toLowerCase().includes(filterBuilding.toLowerCase()))
    .sort((a, b) => {
      const aDate = a.submissionDate || '';
      const bDate = b.submissionDate || '';
      const direction = orderBy === 'asc' ? 1 : -1;
      return direction * aDate.localeCompare(bDate);
    });

  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredComplaints.length / itemsPerPage));
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [filteredComplaints.length]);

  // Table columns with minWidth for each
 const columns =
  viewType === 'detailed'
    ? [
        { key: 'sno', label: 'SNo', minWidth: 60 },
        { key: 'date', label: 'Date', minWidth: 120 },
        { key: 'refNum', label: 'Complaint Num', minWidth: 220 },
        { key: 'building', label: 'Building', minWidth: 320 },
        { key: 'status', label: 'Status', minWidth: 120 },
        { key: 'tenant', label: 'Tenant', minWidth: 120 },
       // { key: 'remarks', label: 'Remarks', minWidth: 250 },
        
        // { key: 'assignedTo', label: 'Assigned To', minWidth: 120 },
        // { key: 'scheduledTime', label: 'Scheduled Date', minWidth: 140 },
        { key: 'action', label: 'Action', minWidth: 150 },
      ]
    : [
        { key: 'sno', label: 'SNo', minWidth: 60 },
        { key: 'date', label: 'Date', minWidth: 120 },
        { key: 'refNum', label: 'Complaint Num', minWidth: 220 },
         
        { key: 'building', label: 'Building', minWidth: 320 },
        { key: 'status', label: 'Status', minWidth: 120 },
        { key: 'unit', label: 'Unit', minWidth: 120 },
        ...(complaintType === 'indoor'
          ? [
              { key: 'block', label: 'Block No', minWidth: 100 },
              { key: 'floor', label: 'Floor No', minWidth: 100 },
              { key: 'place', label: 'Access Area', minWidth: 150 },
            ]
          : []),
        { key: 'description', label: 'Description', minWidth: 450 },
       
      ];

  const handleEdit = (complaint: ComplaintItem) => {
    alert(`Edit complaint: ${complaint.refNum}`);
  };
const handleDelete = async (complaint: ComplaintItem) => {
  setLoading(true);
  // Delete complaint details using complaint_id and subComp_id
  const result = await deleteComplaintDetails(complaint.id, Number(complaint.subComp_id));
  if (result.success) {
    // Refresh complaint details for the same complaintNum
    const refreshed = await getComplaintDetails(complaint.refNum);
    setComplaints(
      (refreshed.complaintDetails || []).map((item: any) => ({
        id: item.complaint_id?.toString() ?? '',
        refNum: item.complaintNum ?? '',
        submissionDate: item.Date ?? '',
        building: item.build_desc ?? '',
        unit: item.unit_desc ?? '',
        block: item.block ?? '',
        floor: item.floor_no ?? '',
        place: item.accessArea ?? '',
        description: item.remarks ?? '', // Use remarks for description in details
        status: item.status ?? '',
        assignedTo: item.assigned_to ?? '',
        scheduledTime: item.assigned_date ?? '',
        category: item.category ?? '',
        remarks: item.remarks ?? '',
        subComp_id: item.subComp_id ?? '',
        Aupdate: item.Aupdate ?? 0,
        complaintDetails: refreshed.complaintDetails || [],
      }))
    );
  } else {
    alert('Failed to delete complaint details: ' + (result.error || 'Unknown error'));
  }
  setLoading(false);
};

if (showChecklistView && checklistProps) {
  return (
    <CheckListView
      Reference={checklistProps.Reference}
      reportData={checklistProps.reportData}
      onNewChecklist={checklistProps.onNewChecklist}
      barcodeValue={checklistProps.barcodeValue}
      barcodeBase64={checklistProps.barcodeBase64}
      fromViewType={checklistProps.fromViewType}
      onBack={() => setShowChecklistView(false)}
    />
  );
}

  return (
    <>
      <div className="container mx-auto p-4 dark:bg-gray-800">
        {/* Filter Modal */}
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
              {/* <div className="mb-4">
                <label className="block font-medium mb-1">Building</label>
                <input
                  type="text"
                  value={filterBuilding}
                  onChange={e => setFilterBuilding(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                />
              </div> */}
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
                    setFilterDate('');
                    setFilterBuilding('');
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

        {/* Header and Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold"> Complaint Reports</h1>
          <div className="flex gap-2">
            <div className="flex rounded-lg overflow-hidden border border-blue-500">
              <button
                type="button"
                className={`px-4 py-1 text-sm font-medium ${viewType === 'branch' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                onClick={() => setViewType('branch')}
              >
                Branch Complaints
              </button>
              <button
                type="button"
                className={`px-4 py-1 text-sm font-medium ${viewType === 'detailed' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                onClick={() => setViewType('detailed')}
              >
                Visited Complaints
              </button>
            </div>
            <div className="flex rounded-lg overflow-hidden border border-blue-500">
  {viewType === 'branch' && (
    <>
      <button
        type="button"
        className={`px-4 py-1 text-sm font-medium ${complaintType === 'indoor' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
        onClick={() => setComplaintType('indoor')}
      >
        Indoor
      </button>
      <button
        type="button"
        className={`px-4 py-1 text-sm font-medium ${complaintType === 'outdoor' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
        onClick={() => setComplaintType('outdoor')}
      >
        Outdoor
      </button>
    </>
  )}
</div>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setShowFilterModal(true)}
            >
              Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          className="overflow-x-auto shadow-md rounded-lg"
          style={{ maxHeight: 500, overflowY: 'auto'}}
        >
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300"
                    style={{ minWidth: col.minWidth }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
           <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
  {loading ? (
    <tr>
      <td colSpan={columns.length} className="px-6 py-4 text-center">
        Loading complaint data...
      </td>
    </tr>
  ) : paginatedComplaints.length === 0 ? (
    <tr>
      <td colSpan={columns.length} className="px-6 py-4 text-center">
        No complaints found
      </td>
    </tr>
  ) : (
    paginatedComplaints.map((complaint, idx) => (
      <tr
        key={idx}
        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
      onClick={() => {
  if (viewType === 'detailed') {
    setChecklistProps({
      Reference: complaint.refNum,
      reportData: { ...complaint, Reference: complaint.refNum }, // Use complaint directly
      onNewChecklist: () => window.location.reload(),
      barcodeValue: `Complaint-${complaint.refNum}-${new Date().toISOString().slice(0, 10)}`,
      barcodeBase64: '',
      fromViewType: viewType
    });
    // console.log("Navigating to checklist view with props:", {
    //   Reference: complaint.refNum,
    //   reportData: { ...complaint, Reference: complaint.refNum },
    //   barcodeValue: `Complaint-${complaint.refNum}-${new Date().toISOString().slice(0, 10)}`
    // });
    setShowChecklistView(true);
    return;
  }

  // For branch view, keep your existing navigation logic if needed
  navigate('/&Complaint Register', {
    state: {
          complaint,
          viewType: 'branch',
          complaintType: 'outdoor',
    }
  });
}}
      >
        <td style={{ minWidth: 60 }} className="px-4 py-4">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
        <td style={{ minWidth: 120 }} className="px-4 py-4">{complaint.submissionDate?.slice(0, 10)}</td>
        <td style={{ minWidth: 220 }} className="px-4 py-4">{complaint.refNum}</td>
        <td style={{ minWidth: 320 }} className="px-4 py-4">{complaint.building}</td>
        <td style={{ minWidth: 120 }} className="px-4 py-4">{complaint.status || '-'}</td>
        {viewType === 'detailed' ? (
          <>
            <td style={{ minWidth: 320 }} className="px-4 py-4">{complaint.tenant || '-'}</td>
            {/* <td style={{ minWidth: 250 }} className="px-4 py-4">{complaint.remarks || '-'}</td> */}
            
            {/* <td style={{ minWidth: 120 }} className="px-4 py-4">{complaint.assignedTo || '-'}</td>
            <td style={{ minWidth: 140 }} className="px-4 py-4">
              {complaint.scheduledTime ? complaint.scheduledTime.slice(0, 10) : '-'}
            </td> */}
            <td style={{ minWidth: 150 }} className="px-4 py-4">
              {/* <button
                className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 mr-2"
                onClick={e => {
                  e.stopPropagation();
                  handleEdit(complaint);
                }}
              >
                Edit
              </button> */}
              <button
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={e => {
                  e.stopPropagation();
                  handleDelete(complaint);
                }}
                disabled={complaint.status?.toLowerCase() !== 'pending'}
                style={complaint.status?.toLowerCase() !== 'pending' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                Delete
              </button>
            </td>
          </>
        ) : (
          <>
            <td style={{ minWidth: 120 }} className="px-4 py-4">{complaint.unit_desc || '-'}</td>
            {complaintType === 'indoor' && (
              <>
                <td style={{ minWidth: 100 }} className="px-4 py-4">{complaint.block || '-'}</td>
                <td style={{ minWidth: 100 }} className="px-4 py-4">{complaint.floor || '-'}</td>
                <td style={{ minWidth: 120 }} className="px-4 py-4">{complaint.place || '-'}</td>
              </>
            )}
            <td style={{ minWidth: 350 }} className="px-4 py-4">{complaint.description || '-'}</td>
            
          </>
        )}
      </tr>
    ))
  )}
</tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            className="px-3 py-1 rounded bg-gray-200"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {Math.max(1, Math.ceil(filteredComplaints.length / itemsPerPage))}
          </span>
          <button
            className="px-3 py-1 rounded bg-gray-200"
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage >= Math.ceil(filteredComplaints.length / itemsPerPage)}
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
        <h2 className="text-xl font-bold mb-4 text-black text-center">Branch Complaint Reports</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black bg-white">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className="px-1 py-1 border border-black text-xs font-bold text-black"
                    style={{ minWidth: col.minWidth }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((complaint, idx) => (
                <tr key={idx}>
                  <td style={{ minWidth: 60 }} className="px-1 py-1 border border-black text-xs text-black text-center">{idx + 1}</td>
                  <td style={{ minWidth: 120 }} className="px-1 py-1 border border-black text-xs text-black">{complaint.submissionDate?.slice(0, 10)}</td>
                  <td style={{ minWidth: 220 }} className="px-1 py-1 border border-black text-xs text-black">{complaint.refNum}</td>
                  <td style={{ minWidth: 320 }} className="px-1 py-1 border border-black text-xs text-black">{complaint.building}</td>
                  {complaintType === 'indoor' && (
                    <>
                      <td style={{ minWidth: 100 }} className="px-1 py-1 border border-black text-xs text-black">{complaint.block || '-'}</td>
                      <td style={{ minWidth: 120 }} className="px-1 py-1 border border-black text-xs text-black">{complaint.place || '-'}</td>
                    </>
                  )}
                  <td style={{ minWidth: 250 }} className="px-1 py-1 border border-black text-xs text-black">{complaint.description || '-'}</td>
                  <td style={{ minWidth: 120 }} className="px-1 py-1 border border-black text-xs text-black">{complaint.status || '-'}</td>
                  <td style={{ minWidth: 120 }} className="px-1 py-1 border border-black text-xs text-black">{complaint.assignedTo || '-'}</td>
                  <td style={{ minWidth: 140 }} className="px-1 py-1 border border-black text-xs text-black">
                    {complaint.scheduledTime ? complaint.scheduledTime.slice(0, 10) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}