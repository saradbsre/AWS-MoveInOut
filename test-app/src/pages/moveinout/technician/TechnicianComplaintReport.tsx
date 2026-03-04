import React, { useState, useEffect } from 'react';
import { getAssignedComplaints, getComplaintDetails, closeComplaint } from '@/services/Transaction/Contract/Contractapi';
import CheckListView from '../../maintenance/CheckListView';
import { formatDateTimeLong } from '@/utils/DateFormat';

interface ComplaintDetail {
  complaint_id: string;
  complaintNum: string;
  Date: string;
  build_id: string;
  build_desc: string;
  unit_desc: string;
  status: string;
  assigned_to: string;
  assigned_by: string;
  assigned_date: string;
  category: string;
  remarks: string;
  auditrev: number;
  userid: string;
  sysdate: string;
  Aupdate: boolean;
  subComp_id: number;
}

export default function TechnicianComplaintReport() {
  const [pending, setPending] = useState<ComplaintDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistProps, setChecklistProps] = useState<any>(null);
  const [closedRows, setClosedRows] = useState<{ [key: string]: boolean }>({});

  const username =
    sessionStorage.getItem('username') ||
    localStorage.getItem('username') ||
    '';

  // Fetch assigned complaints
  useEffect(() => {
    setLoading(true);
    getAssignedComplaints(username).then(result => {
      const filtered = (result.complaints || []).filter(
        (item: any) =>
          item.assigned_to &&
          username &&
          item.assigned_to.toLowerCase() === username.toLowerCase() &&
          item.status?.toLowerCase() === 'assigned'
      );
      setPending(filtered);
      setLoading(false);
    });
  }, [username]);

  // Handle checklist view open
const handleOpenChecklist = async (complaint: ComplaintDetail) => {
  setLoading(true);
  const detailsResult = await getComplaintDetails(complaint.complaintNum);
  setLoading(false);

  // Filter for the clicked complaintNum
  let reportData = null;
  if (detailsResult && Array.isArray(detailsResult.complaintDetails)) {
    reportData = detailsResult.complaintDetails.find(
      (item: any) => item.complaintNum === complaint.complaintNum
    );
  } else if (Array.isArray(detailsResult)) {
    reportData = detailsResult.find(
      (item: any) => item.complaintNum === complaint.complaintNum
    );
  } else {
    reportData = detailsResult;
  }

  setChecklistProps({
    Reference: complaint.complaintNum,
    reportData,
    onNewChecklist: () => window.location.reload(),
    barcodeValue: `Complaint-${complaint.complaintNum}-${new Date().toISOString().slice(0, 10)}`,
    barcodeBase64: '',
  });
  setShowChecklist(true);
};

  // Handle close button
const handleClose = async (complaint_id: string) => {
  setClosedRows(prev => ({ ...prev, [complaint_id]: true }));
  // Call API to update status to "Closed"
  const result = await closeComplaint(complaint_id);
  if (result.success) {
    // Optionally show a success message or refresh the list
    // For example:
    // setPending(prev => prev.filter(c => c.complaint_id !== complaint_id));
    // Or reload complaints from backend
    // alert("Complaint closed successfully!");
  } else {
    // Optionally handle error
    alert(result.error || "Failed to close complaint.");
    setClosedRows(prev => ({ ...prev, [complaint_id]: false }));
  }
};

  // Show checklist view if requested
  if (showChecklist && checklistProps) {
    console.log('Opening checklist with props:', checklistProps);
    console.log('Checklist reportData:', checklistProps.reportData);
    return (
      <CheckListView
        Reference={checklistProps.Reference}
        reportData={checklistProps.reportData}
        onNewChecklist={checklistProps.onNewChecklist}
        barcodeValue={checklistProps.barcodeValue}
        barcodeBase64={checklistProps.barcodeBase64}
        disableActions={true} 
         onBack={() => {
    setShowChecklist(false); // This will hide the checklist and show the complaints list again
  }}
      />
    );
  }

  return (
    <div className="container mx-auto p-4 dark:bg-gray-800">
      <h2 className="text-xl font-bold mb-4">Assigned Complaints</h2>
      <div className="w-full overflow-x-auto shadow-md rounded-lg" style={{ maxHeight: 500 }}>
        <table className="bg-white dark:bg-gray-800" style={{ minWidth: 1000 }}>
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">SNo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Complaint Num</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Building</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Unit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Category</th>
              {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Remarks</th> */}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Assigned Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center">
                  Loading complaints...
                </td>
              </tr>
            ) : pending.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center">
                  No assigned complaints found
                </td>
              </tr>
            ) : (
              pending.map((complaint, idx) => (
                <tr
                  key={complaint.complaint_id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleOpenChecklist(complaint)}
                >
                  <td className="px-4 py-4">{idx + 1}</td>
                  <td className="px-4 py-4">{complaint.Date?.slice(0, 10)}</td>
                  <td className="px-4 py-4" style={{ color: "#2563eb", textDecoration: "underline" }}>
                    {complaint.complaintNum}
                  </td>
                  <td className="px-4 py-4">{complaint.build_desc}</td>
                  <td className="px-4 py-4">{complaint.unit_desc || '-'}</td>
                  <td className="px-4 py-4">{complaint.category || '-'}</td>
                  {/* <td className="px-4 py-4">{complaint.remarks || '-'}</td> */}
                  <td className="px-4 py-4">{complaint.assigned_date ? formatDateTimeLong(complaint.assigned_date) : '-'}</td>
                  <td className="px-4 py-4">
                    {closedRows[complaint.complaint_id] ? (
                      <button className="px-3 py-1 bg-gray-400 text-white rounded" disabled>
                        Closed
                      </button>
                    ) : (
                      <button
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={e => {
                          e.stopPropagation(); // Prevent row click
                          handleClose(complaint.complaint_id);
                        }}
                      >
                        Close
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}