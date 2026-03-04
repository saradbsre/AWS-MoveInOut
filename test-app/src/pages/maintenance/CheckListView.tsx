import React, { useRef, useState, useEffect } from 'react';
import Barcode from 'react-barcode';
import JsBarcode from 'jsbarcode';
import { formatDateShort, formatDateTimeLong, getCurrentDateBarcode } from '@/utils/DateFormat';
// import { SelectedItem } from '@/components/moveinoutcomponents/EquipmentSection';
import ReportHeader from '@/assets/bsreheader.png'
import EstimationCost from '@/pages/maintenance/EstimationCost';
import PageLoader from '@/components/PageLoader';
import '@/styles/Moveinout.css'
import axios from 'axios'
import { useLocation, useNavigate } from 'react-router-dom';
import AssigningForm from '@/components/complaintcomponents/AssigningForm';
import CheckListPrint from './CheckListPrint';

interface EquipmentItem {
  id: string;
  itemno: string;
  itemname: string;
  unit: string;
  qty: number;
  status: "good" | "not working"; // <-- restrict to these values
  remarks: string;
}
export interface ReportData {
  technician: string;
  building: string;
  unit: string;
  tenantCode: string;
  tenant: string;
  contractNo: string;
  contract_sdate: string;
  contract_edate: string;
  visitType: string;
  submissionDate: Date;
  tenantsignature: string;
  techniciansignature: string;
  images: (string | File | Blob | { url?: string; file_id?: string })[];
  videos: (string | File | Blob | { url?: string; file_id?: string })[];
  Reference: string;
  subComp_id?: string | number;
  unitNature?: string;
  unit_master_desc?: string;
  place_desc?: string;
  items?: EquipmentItem[];
  build_id?: string | number;
  build_desc?: string;
  CTenantname?: string;
  contract_id?: string;
  both?: string;
  unit_desc?: string;
  sysdate?: string;
  assigned_to?: string;
  complaintNum?: string;
  unitType?: string;
  technicianSignature?: string;
  tenantSignature?: string;
  emirates?: string;
  complaint_id?: string;
  id?: string;
}

interface ReportViewProps {
  Reference: string;
  reportData?: ReportData;
  onNewChecklist: () => void;
  barcodeValue: string;
  barcodeBase64: string;
  fromHistory?: boolean;
  disableActions?: boolean;
  fromViewType?: string; 
  onBack?: () => void;
}



export default function CheckListView({ Reference,reportData: propReportData, onNewChecklist, fromHistory, disableActions = false, fromViewType, onBack }: ReportViewProps) {
  const navigate = useNavigate();
  // const barcodeBase64 = generateBarcodeBase64(barcodeValue);
  const username = sessionStorage.getItem('username') || 'User';
  const printRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [barcodeBase64, setBarcodeBase64] = useState<string>("");
  const [showEstimationCost, setShowEstimationCost] = useState(false);
  const [hasActiveEstimation, setHasActiveEstimation] = useState(false);
  const [isApprovedEstimation, setIsApprovedEstimation] = useState(false);
  const [checkingEstimation, setCheckingEstimation] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(propReportData ?? null);
  const barcodeValue = reportData ? `${reportData.visitType}-${reportData.contractNo}-${getCurrentDateBarcode()}` : '';
  const apiUrl = import.meta.env.VITE_API_URL;

 // console.log("reportData in CheckListView:", reportData);  

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

  function generateBarcodeBase64(value: string): string {
    if (!value || value.trim() === '') return '';
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, value, {
      format: 'CODE128',
      width: 2,
      height: 40,
      displayValue: false,
    });
    return canvas.toDataURL('image/png');
  }

  function getChecklistImageSrcList(images: number[] | string[]): string[] {
    return images.map(id => `${apiUrl}/api/checklist-image/${id}`);
  }

  useEffect(() => {
    //console.log('Checking for existing estimation cost with Reference:', reportData?.Reference);
    const checkExistingEstimation = async () => {
      try {
        setCheckingEstimation(true);
        const response = await fetch(
          `${apiUrl}/api/check-estimation-exists/${encodeURIComponent(reportData?.Reference || '')}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        //console.log('Estimation check response:', data);
        if (data.success) {
          setHasActiveEstimation(data.exists);
        }
      } catch (error) {
        console.error('Error checking estimation:', error);
      } finally {
        setCheckingEstimation(false);
      }
    };

    if (reportData && reportData.Reference) {
      checkExistingEstimation();
    }
  }, [reportData?.Reference, showEstimationCost]);

    useEffect(() => {
    //console.log('Checking for existing approved estimation cost with Reference:', reportData?.Reference);
    const checkExistingApprovedEstimation = async () => {
      try {
        setCheckingEstimation(true);
        const response = await fetch(
          `${apiUrl}/api/check-estimation-approved/${encodeURIComponent(reportData?.Reference || '')}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        //console.log('Approved estimation check response:', data);
        if (data.success) {
          setIsApprovedEstimation(data.exists);
        }
      } catch (error) {
        console.error('Error checking approved estimation:', error);
      } finally {
        setCheckingEstimation(false);
      }
    };

    if (reportData && reportData.Reference) {
      checkExistingApprovedEstimation();
    }
  }, [reportData?.Reference, showEstimationCost]);

  useEffect(() => {
    if (!barcodeValue) return;
    setBarcodeBase64(generateBarcodeBase64(barcodeValue));
  }, [barcodeValue]);

useEffect(() => {
   if (propReportData) {
   // console.log('Mapping report data from props:', propReportData);
 const mapped: ReportData = {
  complaint_id: propReportData.id || propReportData.complaint_id || '',
  technician: propReportData.assigned_to || '',
  building: Array.isArray(propReportData.build_desc)
    ? propReportData.build_desc[0]
    : propReportData.build_desc || propReportData.building || propReportData.build_id || '',
  unit_desc: propReportData.unit_desc || '',
  build_id: propReportData.build_id,
  tenant: propReportData.tenant|| propReportData.CTenantname || '',
  tenantCode: propReportData.both || '',
  contractNo: propReportData.contractNo || propReportData.contract_id || '',
  contract_sdate: propReportData.contract_sdate || '',
  contract_edate: propReportData.contract_edate || '',
  visitType: propReportData.visitType || '',
  submissionDate: propReportData.sysdate ? new Date(propReportData.sysdate) : new Date(),
  tenantsignature: propReportData.tenantsignature || '',
  techniciansignature: propReportData.techniciansignature || '',
  items: propReportData.items || [],
  images: propReportData.images || [],
  videos: propReportData.videos || [],
  Reference: propReportData.Reference || propReportData.complaintNum || '',
  unit: propReportData.unit || '',
  unitNature: propReportData.unitNature || '', // <-- always a string
  unitType: propReportData.unit_master_desc || '',
  emirates: propReportData.place_desc || '',
};
    setReportData(mapped);
    return;
  }
  if (!Reference) return;
  const fetchReportData = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/checklistDetails`, {
        params: { refNum: Reference },
        withCredentials: true,
      });
      const details = res.data.checklistDetails;
      if (details && details.length > 0) {
        // Map shared fields from the first record
        const first = details[0];
        // Map all equipment items
        const equipment = details.map((raw: EquipmentItem) => ({
          id: raw.id?.toString() || '',
          itemno: raw.itemno || '',
          itemname: raw.itemname || '',
          unit: raw.unit || '',
          qty: raw.qty || 0,
          status: raw.status || '',
          remarks: raw.remarks || '',
        }));
        const mapped: ReportData = {
          technician: first.userid || '',
          building: first.build_desc || first.building || first.build_id || '',
          unit_desc: first.unit_desc || '',
          tenantCode: first.both || '',
          tenant: first.CTenantName || '',
          contractNo: first.contract_id || first.contractNo || '',
          contract_sdate: first.contract_sdate || '',
          contract_edate: first.contract_edate || '',
          visitType: first.visitType || '',
          submissionDate: first.sysdate,
          tenantsignature: first.tenantsignature || '',
          techniciansignature: first.techniciansignature || '',
          //equipment,
          images: first.images || [],
          videos: first.videos || [],
          Reference: first.refNum || '',
          unit: first.unit || '',
          unitNature: first.unitNature || '',
          unitType: first.unit_master_desc || '',
          emirates: first.place_desc || '',
        };
        setReportData(mapped);
        //console.log('Fetched and mapped report data:', mapped);
      } else {
        setReportData(null);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setReportData(null);
    }
  };
  fetchReportData();
}, [Reference, apiUrl, propReportData]);

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;
    let styles = '';
    Array.from(document.querySelectorAll('style,link[rel="stylesheet"]')).forEach((node) => {
      styles += node.outerHTML;
    });
    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(`
  <html>
    <head>
      <title>Checklist Report</title>
      ${styles}
      <style>
        @page {
          margin: 10mm 15mm 25mm 15mm;
        }
        @media print {
          thead { display: table-header-group; }
          @page {
            @bottom-left {
              content: "Printed By: ${username} | ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}";
              font-size: 10px;
              font-family: 'Times New Roman', serif;
              color: black;
            }
            @bottom-right {
              content: "Page " counter(page) " of " counter(pages);
              font-size: 10px;
              font-family: 'Times New Roman', serif;
              color: black;
            }
          }
        }
      </style>
    </head>
    <body>
      <div>${printContents}</div>
      <script>
        window.onload = function() {
          window.focus();
          window.print();
        }
      </script>
    </body>
  </html>
`);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      setTimeout(() => printWindow.close(), 500);
    };
  };

  const handleSendEmail = async () => {
    try {
      if (!reportData) return;
      setIsSending(true);
      const { images, videos, ...reportDataWithoutImages } = reportData;
      const payload = {
        reportData: {
          ...reportDataWithoutImages,
          items: reportData?.items || [], // Always use the latest items from backend
        },
        username,
        barcodeBase64,
      };

      //console.log('Sending email with payload:', payload);  
      const res = await fetch(`${apiUrl}/api/generate-checklist-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove the data:application/pdf;base64, prefix
          const base64Data = result.startsWith('data:') ? result.split(',')[1] : result;
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const location = [reportData?.building, reportData?.unit]
  .filter(Boolean)
  .join(' / ');




      await fetch(`${import.meta.env.VITE_API_URL}/api/send-complaintreport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64,
          contractId: reportData?.contractNo || '',
          tenantName: reportData?.tenant,
          unitNumber: reportData?.unit,
          buildingName: reportData?.building,
          visitType: reportData?.visitType,
          coordinatorName: username,

          companyName: 'ABDULWAHED AHMAD RASHED BIN SHABIB',
          contactNumber: '+971 55-580-9722',
          emailAddress: 'handover.bsre@gmail.com',
          subject: `Complaint Report for Your Building – ${location}`,
        }),
      });
      // Show success modal instead of alert
      setModalMessage("Email sent successfully!");
      setModalType("success");
      setShowModal(true);
    } catch (error) {
      console.error('Error sending email:', error);
      // Show error modal instead of alert
      setModalMessage("Failed to send email. Please try again.");
      setModalType("error");
      setShowModal(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateEstimationCost = () => {
    setShowEstimationCost(true);
  };



  if (showEstimationCost) {
   // console.log('Rendering EstimationCost with data:', reportData);
  return (
    <EstimationCost
      EstimationCostData={{
        technician: reportData ? reportData.technician : '',
        building: reportData ? reportData.build_id : '',
        unit: reportData ? reportData.unit_desc : '',
        tenantCode: reportData ? reportData.tenantCode : '',
        tenant: reportData ? reportData.tenant : '',
        contractNo: reportData ? reportData.contractNo : '',
        start: reportData ? reportData.contract_sdate : '',
        end: reportData ? reportData.contract_edate : '',
        visitType: 'Complaint',
        equipment: reportData ? reportData.items : [], // Pass the checklist items
        Reference: reportData ? reportData.Reference : '',
        submissionDate: reportData ? reportData.submissionDate : ''
      }}
      onNewChecklist={() => setShowEstimationCost(false)}
      fromHistory={true}
    />
  );
}

  // if (!reportData) {
  //   return <PageLoader />;
  // }
  //console.log('Report data:', reportData);
  if (!reportData) {
  return <div className="text-center py-8 text-gray-600">No checklist data found for this complaint.</div>;
}

//console.log('Report data is available, rendering CheckListView:', reportData);

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center justify-center mb-4">
              {modalType === "success" ? (
                <div className="bg-green-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="bg-red-100 p-3 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className={`text-center text-lg font-medium mb-4 ${modalType === "success" ? "text-green-600" : "text-red-600"
              }`}>
              {modalType === "success" ? "Success!" : "Error"}
            </h3>
            <p className="text-center text-sm text-gray-600 dark:text-gray-300">
              {modalMessage}
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-800 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >Close
              </button>
            </div>
          </div>
        </div>
      )}
        {/* Hidden print area */}
            <div style={{ display: 'none' }}>
              <div ref={printRef}>
               <CheckListPrint
                 reportData={{
                    ...reportData,
                    items: reportData.items || [],
                    unitNature: reportData.unitNature || '',
                    unitType: reportData.unitType || '',
                    emirates: reportData.emirates || '',
                    // ...add any other required fields here
                }}
                selectedEquipment={reportData.items || []}
                fromHistory={fromHistory}
                username={username}
                />
              </div>
            </div>
      <div className="print-content print-container p-4 max-w-4xl mx-auto space-y-6 bg-white">
        <div className="content-wrapper">
          {/* Company Header */}
          <div className="w-full mb-6">
            <img
              src={ReportHeader}
              alt="ABDULWAHED AHMAD RASHED BIN SHABIB Real Estate"
              className="w-full h-auto object-contain"
            />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between my-4 relative">
            {/* Left spacer */}
            <div className="flex-1" />
            {/* Centered title */}
            <div className="flex items-center justify-center my-4 relative">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-black text-center">
                Complaint Checklist Report 
              </h1>
            </div>
            {/* Barcode right */}
            <div className="flex-1 flex items-center justify-end">
              <div className="barcode-print-size flex items-center barcode-print-only">
              {barcodeValue && (
                <Barcode
                  value={barcodeValue}
                  width={1}
                  height={40}
                  fontSize={12}
                />
              )}
              </div>
            </div>
          </div>
          <div className="mb-2 text-base font-semibold">
            Complaint No:<span className="font-mono">{reportData.Reference}</span>
          </div>
          {/* Report Table */}
          <div className="overflow-x-auto">
  <table className="w-full border-collapse border border-black bg-white no-wrap-table">
    <tbody>
      <tr>
        <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Tenant</td>
        <td className="w-2/3 bg-white p-2 text-xs font-normal text-black border border-black" colSpan={3}>
          { reportData.tenant?.trim() || "-" }
        </td>
      </tr>
      <tr>
        <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Building</td>
        <td className="w-2/3 bg-white p-2 text-xs font-normal text-black border border-black" colSpan={3}>
          {typeof reportData.building === 'string' ? reportData.building.trim() : String(reportData.building || "-")}
        </td>
      </tr>
      <tr>
        <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Unit</td>
        <td className="w-1/6 bg-white p-2 text-xs font-normal text-black border border-black">
          {reportData.unit_desc?.trim() || "-"}
        </td>
        <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Unit Nature</td>
        <td className="w-1/6 bg-white p-2 text-xs font-normal text-black border border-black">
          {reportData.unitNature?.toUpperCase() === "R"
            ? "Residential"
            : reportData.unitNature?.toUpperCase() === "C"
              ? "Commercial"
              : "-"}
        </td>
      </tr>
      <tr>
        <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Unit Type</td>
        <td className="w-1/6 bg-white p-2 text-xs font-normal text-black border border-black">
          {reportData.unitType?.trim() || "-"}
         
        </td>
        <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Visit Type</td>
        <td className="w-1/6 bg-white p-2 text-xs font-normal text-black border border-black">
          {reportData.visitType?.trim() || "-"}
        </td>
      </tr>
      <tr>
        <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Contract No</td>
        <td className="w-1/6 bg-white p-2 text-xs font-normal text-black border border-black">
          {reportData.contractNo?.trim() || "-"}
        </td>
        <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Start Date</td>
        <td className="w-1/6 bg-white p-2 text-xs font-normal text-black border border-black">
          {reportData.contract_sdate ? formatDateShort(reportData.contract_sdate) : "-"}
        </td>
      </tr>
      <tr>
        <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Emirates</td>
        <td className="w-1/6 bg-white p-2 text-xs font-normal text-black border border-black">
          {/* If you have a property for Emirates, use it here, else show '-' */}
          {reportData.emirates?.trim() || "-"}
        </td>
        <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">End Date</td>
        <td className="w-1/6 bg-white p-2 text-xs font-normal text-black border border-black">
          {reportData.contract_edate ? formatDateShort(reportData.contract_edate) : "-"}
        </td>
      </tr>
    </tbody>
  </table>
</div>
          {/* Equipment Status Section */}
          <div className="mt-8 mb-4">
            <div className="inline-block">
              <h3 className="text-xs font-semibold text-gray-700 dark:text-black mb-1 text-base border-b-2 border-black w-full">
                Equipment Status:
              </h3>
            </div>
          </div>
          {/* Equipment Checklist Table */}
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-full border-collapse border border-black bg-white table-fixed no-wrap-table">
              <thead className="bg-gray-100">
                <tr>
                  <th className="bg-white p-2 text-xs font-bold text-black border border-black w-[5%]">SI No</th>
                  <th className="bg-white p-2 text-xs font-bold text-black border border-black w-[40%]">Item Name</th>
                  <th className="bg-white p-2 text-xs font-bold text-black border border-black w-[5%]">Unit</th>
                  <th className="bg-white p-2 text-xs font-bold text-black border border-black w-[10%]">QTY</th>
                  {/* <th className="bg-white p-2 text-xs font-bold text-black border border-black w-[10%]">Status</th> */}
                  <th className="bg-white p-2 text-xs font-bold text-black border border-black w-[30%]">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(reportData?.items?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-2 border border-black text-center text-xs sm:text-sm text-black font-bold">
                      Condition All Good
                    </td>
                  </tr>
                ) : (
                  (reportData?.items ?? []).map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="px-3 py-2 border border-black text-xs text-black w-[5%] text-center">{idx + 1}</td>
                      <td className="px-3 py-2 border border-black text-xs text-black w-[45%]">{item.itemname}</td>
                      <td className="px-3 py-2 border border-black text-xs text-black text-center w-[5%]">{item.unit}</td>
                      <td className="px-3 py-2 border border-black text-xs text-black w-[5%] text-center">{item.qty}</td>
                      {/* <td className="px-3 py-2 border border-black capitalize text-xs text-black w-[10%] text-center">{item.status}</td> */}
                      <td className="px-3 py-2 border border-black text-xs text-black w-[30%]">{item.remarks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
          {reportData && reportData.images && reportData.images.length > 0 && (
            (() => {
              const srcList = getChecklistImageSrcList(
  reportData.images
    .map(img =>
      typeof img === 'string'
        ? img
        : typeof img === 'object' && img !== null && 'file_id' in img && typeof img.file_id === 'string'
          ? img.file_id
          : typeof img === 'object' && img !== null && 'url' in img && typeof img.url === 'string'
            ? img.url
            : null
    )
    .filter((id): id is string => typeof id === 'string')
);
              return (
                <div className="mb-4">
                  <span className="font-semibold">Uploaded Images:</span>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {srcList.map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`Checklist ${idx + 1}`}
                        className="w-32 h-32 object-cover border rounded"
                      />
                    ))}
                  </div>
                </div>
              );
            })()
          )}
        {/* <div className="flex-grow"> */}
        {/* Signatures at bottom of page */}
        <div className="signatures-bottom flex flex-col sm:flex-row justify-between items-start w-full">
          {/* Tenant Signature Box - Left */}
          <div className="flex flex-col items-start">
            <span className="font-bold text-black text-xs mb-1">ACCEPTED BY:</span>
            <span className="font-bold text-black mb-2 text-xs">{!reportData.tenant || reportData.tenant.trim().toUpperCase() === "N/A" ? "Branch" : reportData.tenant}</span>
            <div className="border-2 border-black rounded-lg bg-white flex items-center justify-center w-40 h-16 mb-2">
              {reportData && reportData.tenantsignature ? (
                <img
                  src={reportData.tenantsignature}
                  alt="Tenant Signature"
                  className="h-12 object-contain"
                  style={{ filter: 'none' }}
                />
              ) : (
                <span className="text-gray-500 text-xs">No signature provided</span>
              )}
            </div>
          </div>
          {/* Technician Signature Box - Right */}
          <div className="flex flex-col items-start">
            <span className="font-bold text-black text-xs mb-1">PREPARED BY:</span>
            <span className="font-bold text-black mb-2 text-xs">{fromHistory ? reportData.technician : (username || 'Technician')}</span>
            <div className="border-2 border-black rounded-lg bg-white flex items-center justify-center w-40 h-16 mb-2">
              {reportData && reportData.techniciansignature ? (
                <img
                  src={reportData.techniciansignature}
                  alt="Technician Signature"
                  className="h-12 object-contain"
                  style={{ filter: 'none' }}
                />
              ) : (
                <span className="text-gray-500 text-xs">No signature provided</span>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* </div>    */}
      {/* Action Buttons */}
      <div className="no-print flex flex-col sm:flex-row gap-4 justify-center pt-6">
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors"
        >
          {/* ...print icon... */}
          Print Checklist
        </button>
       <button
            type="button"
              onClick={() => {
    if (onBack) {
      onBack(); // Go back to complaint report table
    } else {
      // fallback: navigate(-1)
      navigate(-1);
    }
  }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-blue-700 dark:border-gray-600 transition-colors"
          >
            {/* ...back icon... */}
            Back 
          </button>
        <button
          type="button"
          onClick={handleSendEmail}
          disabled={isSending || disableActions}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>

              Sending...
            </>
          ) : (
            'Send By Email'
          )}
        </button>

        <button
          type="button"
          onClick={handleGenerateEstimationCost}
          disabled={hasActiveEstimation || checkingEstimation || disableActions}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-700"
          title={hasActiveEstimation ? 'This checklist already has an active estimation cost' : ''}
        >
          {checkingEstimation ? 'Checking...' : 'Generate Estimation Cost'}
        </button>
        <button
  type="button"
  onClick={() => {
    navigate('/&Complaint Register', {
      state: {
        complaint: reportData,
        fromDetailedView: true,
        viewType: 'assign',
        returnTo: 'detailed'
      }
    });
  }}
 disabled={!isApprovedEstimation || disableActions}
  className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-blue-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-blue-700 dark:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  title={!isApprovedEstimation ? 'Estimation must be approved before assigning' : ''}
>
  Go to Assign
</button>
      </div>
    </>
  );
}