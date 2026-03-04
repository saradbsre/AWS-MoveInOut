import { useRef } from 'react';
import ReportHeader from '@/assets/bsreheader.png'
import { formatDateTimeLong } from '@/utils/DateFormat';
import '@/styles/Complaint.css'
import { insertComplaint } from '@/services/Transaction/Contract/Contractapi';

interface EquipmentItem {
  roomType?: string;
  category?: string;
  equipment: string;
  remarks: string;
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
  submissionDate:  string;
  description: string;
  images: (File | string | ComplaintImage)[];
  videos: (File | string | ComplaintImage)[];
  username: string;
  status: string;
  equipment: EquipmentItem[];
  both: string;
  build_id: string;
  unit_desc: string;
  referenceNumber: string;
  area_desc?: string;
  place_desc?: string;
  place_id?: string;
  area_id?: string;
}

export default function ComplaintReportView({
  data,
  onNewChecklist,
  onSubmit,
  onBack,
  view
}: {
  data: ComplaintReportData;
  onNewChecklist?: () => void;
  onSubmit?: (data: ComplaintReportData) => void;
  onBack?: () => void;
  view: string;
}) {

  

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
          margin: 13mm 15mm 25mm 15mm;
          size: A4 portrait;
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
  // Print handler
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

function getRefNum(data: ComplaintReportData) {
  // Use only numbers and letters, no spaces or special characters
  const safe = (str: string) => (str || '').replace(/[^a-zA-Z0-9]/g, '');
  const date = new Date(data.submissionDate);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const refDate =
    pad(date.getDate()) +
    pad(date.getMonth() + 1) +
    date.getFullYear() +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds());
  // both, build_id, unit_desc, refdate
  return (
    //safe(data.username) +
   // safe(data.building) +
    safe(data.unit) +
    refDate
  );
}
const referenceNumber = getRefNum(data);

function getImageSrcList(images: any[]): string[] {
  const apiUrl = import.meta.env.VITE_API_URL;
  return images.map(img => {
    if (img && typeof img === 'object' && 'file_id' in img) {
      const fileId = typeof img.file_id === 'string'
        ? img.file_id
        : (img.file_id && typeof img.file_id === 'object' && '$oid' in img.file_id)
          ? img.file_id.$oid
          : '';
      return `${apiUrl}/api/complaint-image/${fileId}`;
    } else if (typeof img === 'string') {
      // If it's a relative path, prepend the API URL
      if (img.startsWith('/api/complaint-image/')) {
        return `${apiUrl}${img}`;
      }
      return img;
    } else if (img instanceof Blob) {
      return URL.createObjectURL(img);
    } else if (img && typeof img === 'object' && 'url' in img) {
      return img.url;
    }
    return '';
  }).filter(Boolean);
}

async function submitAllComplaints(data: ComplaintReportData) {
  if (!data.equipment || !Array.isArray(data.equipment)) return;
  for (const eq of data.equipment) {
    await insertComplaint({
      build_id: data.build_id,
      unit_desc: data.unit_desc,
      place_id: (data as any).place_id, // if not in type, use as any or extend type
      area_id: (data as any).area_id,
      contract_id: data.contractNo,
      contract_sdate: data.startDate,
      contract_edate: data.endDate,
      refNum: referenceNumber,
      status: data.status,
      both: data.both,
      CTenantName: data.tenant,
      category: eq.category || '',
      roomType: eq.roomType || '',
      issued_item: eq.equipment || '',
      remarks: eq.remarks || '',
      reportedby: data.username,
      userid: data.username,
    });
  }
}
  return (
      <div id="pdf-report" ref={printRef} className="print-container p-4 max-w-4xl mx-auto space-y-6 bg-white">
        <div className="content-wrapper">
          {/* Company Header */}
          <div className="w-full mb-6">
            <img 
              src={ReportHeader}
              alt="ABDULWAHED AHMAD RASHED BIN SHABIB Real Estate" 
              className="w-full h-auto object-contain"
            />
          </div>
        <div className="text-2xl font-bold text-center">Complaint</div>
      </div>
      <div className="mb-2 text-base font-semibold">
      Reference No: <span className="font-mono">{referenceNumber}</span>
      </div>
      {/* Info Table */}
      <table className="w-full mb-6 border border-black text-sm">
  <tbody>
    <tr>
      <td className="border px-2 py-1 font-semibold w-32">Tenant</td>
      <td className="border px-2 py-1" colSpan={3}>{data.tenant}</td>
    </tr>
    <tr>
      <td className="border px-2 py-1 font-semibold w-32">Building</td>
      <td className="border px-2 py-1" colSpan={3}>{data.building}</td>
    </tr>
    <tr>
 
      <td className="border px-2 py-1 font-semibold">Unit</td>
      <td className="border px-2 py-1">{data.unit}</td>
       <td className="border px-2 py-1 font-semibold">Contract No</td>
      <td className="border px-2 py-1">{data.contractNo}</td>
    </tr>
     <tr>
 
      <td className="border px-2 py-1 font-semibold">Area</td>
      <td className="border px-2 py-1">{data.area_desc}</td>
       <td className="border px-2 py-1 font-semibold">Emirate</td>
      <td className="border px-2 py-1">{data.place_desc}</td>
    </tr>
    <tr>
      <td className="border px-2 py-1 font-semibold">Date</td>
      <td className="border px-2 py-1">
        {data.submissionDate
          ? new Date(data.submissionDate).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : ''}
      </td>
        <td className="border px-2 py-1 font-semibold">Status</td>
      <td className="border px-2 py-1" colSpan={3}>{data.status}</td>
    </tr>
    <tr>
      <td className="border px-2 py-1 font-semibold">Start</td>
      <td className="border px-2 py-1">
        {data.startDate
          ? new Date(data.startDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : ''}
      </td>
      <td className="border px-2 py-1 font-semibold">End</td>
      <td className="border px-2 py-1">
        {data.endDate
          ? new Date(data.endDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : ''}
      </td>
    </tr>
   
  </tbody>
</table>
      {/* Equipment Table */}
      <div className="font-semibold mb-2">Complaint Details:</div>
      <table className="w-full mb-6 border border-black text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Sl No</th>
            <th className="border px-2 py-1">Room Type</th>
            <th className="border px-2 py-1">Category</th>
            <th className="border px-2 py-1">Affected Area</th>
            <th className="border px-2 py-1">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {data.equipment.map((item, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1 text-center">{idx + 1}</td>
              <td className="border px-2 py-1 text-center">{item.roomType || ""}</td>
              <td className="border px-2 py-1 text-center">{item.category || ""}</td>
              <td className="border px-2 py-1 text-center">{item.equipment}</td>
              <td className="border px-2 py-1 text-center">{item.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Description */}
    {data.description && (
  <div className="mb-4">
    <span className="font-semibold">Description:</span>
    <div className="border border-gray-300 rounded p-2 mt-1 text-gray-700">{data.description}</div>
  </div>  
)}
<div className="mt-2">
  <label className="block text-sm  font-semibold  mb-1">
    Reported by:
  </label>
  <span className="text-gray-800 dark:text-gray-200">
    {username ?? "N/A"}
  </span>
</div>
   {data.images && data.images.length > 0 && (
  (() => {
    const srcList = getImageSrcList(data.images);
    // console.log("getImageSrcList output:", srcList);
    return (
      <div className="mb-4 ">
        <span className="font-semibold">Uploaded Images:</span>
        <div className="flex flex-wrap gap-4 mt-2">
          {srcList.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={`Uploaded ${idx + 1}`}
              className="w-32 h-32 object-cover border rounded"
              onLoad={() => src.startsWith('blob:') && URL.revokeObjectURL(src)}
            />
          ))}
        </div>
      </div>
    );
  })()
)}
       <div className="no-print flex flex-col sm:flex-row gap-4 justify-center pt-6">
        
          <button
           className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors"
           onClick={onBack}
          >
           Back
        </button>
        
        <button
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors"
          onClick={handlePrint}
        >
          Print 
        </button>
        {view === "Enabled" && (
        <button
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors"
          onClick={onNewChecklist}
        >
          New Complaint
        </button>
        )}
       
      </div>
    </div>
  );
}