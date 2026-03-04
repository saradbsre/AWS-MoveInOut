import React from "react";
import Select from "react-select";

type Option = { value: string; label: string };

interface TechWorkHistoryProps {
  areas: Option[];
  areaTechnicians: Option[];
  workHistoryArea: Option | null;
  setWorkHistoryArea: (area: Option | null) => void;
  workHistoryTech: Option | null;
  setWorkHistoryTech: (tech: Option | null) => void;
  filteredComplaintDetails: any[];
  categoryMap: { [code: string]: string };
  // Optionally: loading, error, etc.
  // loading?: boolean;
  // error?: string;
  // ...other props as needed
  areaLabel?: string;
}

function formatDateTime(dt: string) {
  if (!dt) return "";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}

const TechWorkHistory: React.FC<TechWorkHistoryProps> = ({
  areas,
  areaTechnicians,
  workHistoryArea,
  setWorkHistoryArea,
  workHistoryTech,
  setWorkHistoryTech,
  filteredComplaintDetails,
  categoryMap,
  areaLabel,
}) => {
  return (
  <div className="w-full bg-white rounded-lg shadow p-4 flex flex-col items-center">
  <h2 className="text-xl font-bold mb-4 text-center w-full">Technician Work History</h2>
  <div className="flex gap-4 mb-4 w-full">
        <div className="flex-1">
          <Select
            options={areas}
            value={workHistoryArea}
            onChange={setWorkHistoryArea}
            isClearable
            isSearchable
            placeholder="Select Area"
            classNamePrefix="react-select"
          />
        </div>
        <div className="flex-1">
          <Select
            options={areaTechnicians}
            value={workHistoryTech}
            onChange={setWorkHistoryTech}
            isClearable
            isSearchable
            placeholder="Select Technician"
            classNamePrefix="react-select"
          />
        </div>
      </div>
      {/* Complaint Details Table */}
      <div className="mt-4 rounded-lg overflow-x-auto border border-gray-200 bg-white w-full">
        <h3 className="text-md font-bold mb-2">
          Complaint Details {areaLabel ? `for ${areaLabel}` : "(All Areas)"}
        </h3>
       <table className="overflow-x-auto text-sm table-auto border-separate border-spacing-0">
  <thead>
    <tr className="bg-gray-50 border-b border-gray-200 uppercase text-xs text-gray-500 font-bold">
      <th className="py-2 px-4 text-left w-12">S.NO</th>
      <th className="py-2 px-4 text-left w-36">DATE & TIME</th>
      <th className="py-2 px-4 text-left w-64">BUILDING</th>
      <th className="py-2 px-4 text-left w-48">CATEGORY</th>
      <th className="py-2 px-4 text-left w-32">TECHNICIAN</th>
      <th className="py-2 px-4 text-left w-24">STATUS</th>
    </tr>
  </thead>
  <tbody>
    {filteredComplaintDetails.length === 0 ? (
      <tr>
        <td colSpan={6} className="py-4 px-4 text-center text-gray-400">
          No assigned complaint details found.
        </td>
      </tr>
    ) : (
      filteredComplaintDetails.map((detail, idx) => (
        <tr key={idx} className="hover:bg-gray-100 transition-colors">
          <td className="py-2 px-4 align-middle">{idx + 1}</td>
          <td className="py-2 px-4 align-middle">{formatDateTime(detail.assigned_date)}</td>
          <td className="py-2 px-4 align-middle">{detail.build_desc || detail.building || detail.build_id || "-"}</td>
          <td className="py-2 px-4 align-middle">
            {categoryMap[detail.category ?? ""] || detail.category || "-"}
          </td>
          <td className="py-2 px-4 align-middle">{detail.assigned_to || "-"}</td>
          <td className="py-2 px-4 align-middle">{detail.status || "-"}</td>
        </tr>
      ))
    )}
  </tbody>
</table>
      </div>
    </div>
  );
};

export default TechWorkHistory;