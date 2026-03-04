import React, { useState, useEffect } from 'react';
import ReportHeader from '@/assets/bsreheader.png';
import '@/styles/ChecklistHistory.css';
import { getComplaints, editComplaint, deleteComplaint, getBuildings } from '@/services/Transaction/Contract/Contractapi';
import { useNavigate } from 'react-router-dom';

// Extend ChecklistItem for complaint fields
interface ChecklistItem {
  id: string;
  refNum: string;
  submissionDate: string;
  building: string;
  type?: string;
  block?: string;
  floor?: string;
  place?: string;
  unit?: string;
  description?: string;
  status?: string;
  complaintDetails?: any[];
}

export default function ComplaintReport() {
  const [complaints, setComplaints] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [orderBy, setOrderBy] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [complaintType, setComplaintType] = useState<'indoor' | 'outdoor'>('indoor');
  const [editModal, setEditModal] = useState<{ open: boolean; complaint: ChecklistItem | null }>({ open: false, complaint: null });
  const [editDescription, setEditDescription] = useState('');
  const [editBlock, setEditBlock] = useState('');
  const [editFloor, setEditFloor] = useState('');
  const [editPlace, setEditPlace] = useState('');
  const [filterUnit, setFilterUnit] = useState('');

  const itemsPerPage = 25;
  const navigate = useNavigate();

  

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      const result = await getComplaints();
      // Map API fields to table fields for consistency
      setComplaints(
        (result.complaints || []).map((item: any) => ({
          id: item.complaint_id?.toString() ?? '',
          refNum: item.complaintNum ?? '',
          submissionDate: item.Date ?? '',
          building: item.build_desc ?? '',
          block: item.block ?? '',
          floor: item.floor_no ?? '',
          place: item.accessArea ?? '',
          unit: item.unit_desc ?? '',
          description: item.description ?? '',
          status: item.status ?? '',
          type: item.type ?? '',
          complaintDetails: item.complaintDetails || [],
          authLevel: item.authLevel ?? 0,
          authStatus: item.authStatus ?? '',
        }))
      );
      setLoading(false);
    };
    fetchComplaints();
  }, []);


// const handleSaveEdit = async () => {
//   if (!editModal.complaint) return;
//   const payload = {
//     complaint_id: editModal.complaint.id,
//     description: editDescription,
//     block: editBlock,
//     floor: editFloor,
//     place: editPlace,
    
//   };
//   const result = await editComplaint(payload);
//   if (result.success) {
//     // Refresh complaints list with all fields mapped
//     setLoading(true);
//     const refreshed = await getComplaints();
//     setComplaints(
//       (refreshed.complaints || []).map((item: any) => ({
//         id: item.complaint_id?.toString() ?? '',
//         refNum: item.complaintNum ?? '',
//         submissionDate: item.Date ?? '',
//         building: item.build_desc ?? '',
//         block: item.block ?? '',
//         floor: item.floor_no ?? '',
//         place: item.accessArea ?? '',
//         unit: item.unit_desc ?? '',
//         description: item.description ?? '',
//         status: item.status ?? '',
//         type: item.type ?? '',
//         complaintDetails: item.complaintDetails || [],
//       }))
//     );
//     setEditModal({ open: false, complaint: null });
//     setLoading(false);
//   } else {
//     alert('Failed to update complaint: ' + (result.error || 'Unknown error'));
//   }
// };

const handleDelete = async (complaint: ChecklistItem) => {
  setLoading(true);
  const result = await deleteComplaint(complaint.id);
  if (result.success) {
    const refreshed = await getComplaints();
    setComplaints(
      (refreshed.complaints || []).map((item: any) => ({
        id: item.complaint_id?.toString() ?? '',
        refNum: item.complaintNum ?? '',
        submissionDate: item.Date ?? '',
        building: item.build_desc ?? '',
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
  } else {
    alert('Failed to delete complaint: ' + (result.error || 'Unknown error'));
  }
  setLoading(false);
};

  // Filtering
const filteredComplaints = complaints
  .filter(item => item.type === complaintType)
  .filter(item => !filterDate || item.submissionDate?.slice(0, 10) === filterDate)
  .filter(item => !filterBuilding || item.building === filterBuilding)
  .filter(item => !filterUnit || (item.unit ?? '').toLowerCase().includes(filterUnit.toLowerCase()))
  .sort((a, b) => {
    const aDate = a.submissionDate || '';
    const bDate = b.submissionDate || '';
    const direction = orderBy === 'asc' ? 1 : -1;
    return direction * aDate.localeCompare(bDate);
  });

  const [allBuildings, setAllBuildings] = useState<{ build_id: string; build_desc: string }[]>([]);

useEffect(() => {
  const fetchBuildings = async () => {
    const result = await getBuildings();
    setAllBuildings(result.buildings || []);
  };
  fetchBuildings();
}, []);

  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredComplaints.length / itemsPerPage));
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [filteredComplaints.length]);

  // Table columns (wider minWidth, removed assignedTo and scheduledTime)
const columns = [
  { key: 'sno', label: 'SNo', minWidth: 60 },
  { key: 'date', label: 'Date', minWidth: 120 },
  { key: 'refNum', label: 'Complaint Num', minWidth: 220 },
  { key: 'building', label: 'Building', minWidth: 350 },
  { key: 'unit', label: 'Unit', minWidth: 120 },
  ...(complaintType === 'indoor'
    ? [
        { key: 'block', label: 'Block', minWidth: 120 },
        { key: 'floor', label: 'Floor', minWidth: 120 },
        { key: 'place', label: 'Access area', minWidth: 140 },
      ]
    : []),
  
  { key: 'description', label: 'Description', minWidth: 390 },
  // { key: 'status', label: 'Status', minWidth: 120 },

];

   const handleEdit = (complaint: ChecklistItem) => {
  navigate('/&Complaint Register', {
    state: {
      complaint,
      fromDetailedView: true, // or any flag you want
      viewType: 'edit'
    }
  });
};

const buildingOptions = Array.from(new Set(complaints.map(c => c.building))).filter(Boolean);


  return (
    <>
      <div className="container mx-auto p-4 dark:bg-gray-800">
        {/* Edit Modal */}
        {editModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-lg font-bold mb-4">Edit Complaint</h2>
             
              <label className="block font-medium mb-1">Block</label>
              <input
                className="w-full border rounded px-2 py-1 mb-4"
                value={editBlock}
                onChange={e => setEditBlock(e.target.value)}
              />
              <label className="block font-medium mb-1">Floor</label>
              <input
                className="w-full border rounded px-2 py-1 mb-4"
                value={editFloor}
                onChange={e => setEditFloor(e.target.value)}
              />
              <label className="block font-medium mb-1">Access Area</label>
              <input
                className="w-full border rounded px-2 py-1 mb-4"
                value={editPlace}
                onChange={e => setEditPlace(e.target.value)}
              />
               <label className="block font-medium mb-1">Description</label>
              <textarea
                className="w-full border rounded px-2 py-1 mb-4"
                rows={4}
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={() => setEditModal({ open: false, complaint: null })}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  //onClick={handleSaveEdit}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
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
    <div className="mb-4">
  <label className="block font-medium mb-1">Building</label>
  <select
    className="w-full border rounded px-2 py-1"
    value={filterBuilding}
    onChange={e => setFilterBuilding(e.target.value)}
  >
    <option value="">All</option>
    {allBuildings.map(b => (
      <option key={b.build_id} value={b.build_desc}>
        {b.build_desc}
      </option>
    ))}
  </select>
</div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Unit</label>
        <input
          type="text"
          value={filterUnit}
          onChange={e => setFilterUnit(e.target.value)}
          className="w-full border rounded px-2 py-1"
          placeholder="Enter unit"
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
            setFilterDate('');
            setFilterBuilding('');
            setFilterUnit('');
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
          <h1 className="text-2xl font-bold">Branch Complaint Reports</h1>
          <div className="flex gap-2">
            <div className="flex rounded-lg overflow-hidden border border-blue-500">
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
  className="w-full overflow-x-auto overflow-y-auto shadow-md rounded-lg"
  style={{ maxHeight: 500 }}
>

          <table
  className="bg-white dark:bg-gray-800"
  style={{ minWidth: 1400 }}
>

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
                  <tr key={complaint.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => handleEdit(complaint)}>
  <td className="px-4 py-4">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
  <td className="px-4 py-4">{complaint.submissionDate?.slice(0, 10)}</td>
  <td className="px-4 py-4">{complaint.refNum}</td>
  <td className="px-4 py-4">{complaint.building}</td>
  <td className="px-4 py-4">{complaint.unit || '-'}</td>
  {complaintType === 'indoor' && (
    <>
      <td className="px-4 py-4">{complaint.block || '-'}</td>
      <td className="px-4 py-4">{complaint.floor || '-'}</td>
      <td className="px-4 py-4">{complaint.place || '-'}</td>
    </>
  )}
  
  <td className="px-4 py-4">{complaint.description || '-'}</td>
  {/* <td className="px-4 py-4">{complaint.status || '-'}</td> */}

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
    </>
  );
}