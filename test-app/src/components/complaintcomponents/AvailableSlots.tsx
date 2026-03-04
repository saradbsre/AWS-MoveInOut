import React, { useEffect, useState } from "react";
import { getAssignedComplaints } from "@/services/Transaction/Contract/Contractapi";

interface ComplaintDetail {
  complaint_id: string;
  complaintNum: string;
  Date: string;
  build_id: string;
  build_desc: string;
  unit_desc: string;
  status: string;
  assigned_to: string;
  assigned_date: string;    
  category: string;
  remarks: string;
  block?: string; // Add block if available in your data
}

interface AvailableSlotsProps {
  technicianName: string;
}

const AvailableSlots: React.FC<AvailableSlotsProps> = ({ technicianName }) => {
  const [works, setWorks] = useState<ComplaintDetail[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
    if (!technicianName) {
      setWorks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Use getAssignedComplaints instead of getComplaintDetails
    getAssignedComplaints(technicianName).then((result) => {
      const filtered =
        (result.complaints || []).filter(
          (item: ComplaintDetail) =>
            item.status &&
            item.status.toLowerCase() !== "visited" &&
            item.status.toLowerCase() !== "completed"
        );
      setWorks(filtered);
      setLoading(false);
    });
  }, [technicianName]);

  if (!technicianName) {
    return <div className="text-gray-500">Select a technician to view works.</div>;
  }

  if (loading) {
    return <div>Loading works...</div>;
  }

  if (works.length === 0) {
    return <div className="text-gray-500">No pending works for {technicianName}.</div>;
  }

  return (
    <div>
      <h3 className="font-bold mb-2">Works for {technicianName}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: 60 }}>SNO</th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: 180 }}>DATE</th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: 210 }}>COMPLAINT NUM</th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: 300 }}>BUILDING</th>
              <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ minWidth: 120 }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {works.map((work, idx) => (
              <tr key={work.complaint_id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-center">{idx + 1}</td>
                <td className="px-4 py-2">
                  {work.assigned_date
    ? (() => {
        const d = new Date(work.assigned_date);
        // Get UTC values
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        let hour = d.getUTCHours();
        const min = String(d.getUTCMinutes()).padStart(2, "0");
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12;
        hour = hour ? hour : 12;
        return `${y}-${m}-${day} ${hour}:${min} ${ampm}`;
      })()
    : "-"}
                </td>
                <td className="px-4 py-2">{work.complaintNum}</td>
                <td className="px-4 py-2">{work.build_desc}</td>
                <td className="px-4 py-2">{work.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AvailableSlots;