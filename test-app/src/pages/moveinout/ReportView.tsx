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
  startDate: string;
  endDate: string;
  visitType: string;
  submissionDate: Date;
  tenantSignature: string;
  technicianSignature: string;
  equipment: EquipmentItem[];
  // images: number;
  // videos: number;
  images: (number | string | File | Blob | { url?: string; file_id?: string })[];
  videos: (number | string | File | Blob | { url?: string; file_id?: string })[];
  Reference: string;
}

interface ReportViewProps {
  Reference: string;
  onNewChecklist: () => void;
  barcodeValue: string;
  barcodeBase64: string;
  fromHistory?: boolean;
}



export default function ReportView({ Reference, onNewChecklist, fromHistory }: ReportViewProps) {
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
  const [checkingEstimation, setCheckingEstimation] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const barcodeValue = reportData ? `${reportData.visitType}-${reportData.contractNo}-${getCurrentDateBarcode()}` : '';
  const apiUrl = import.meta.env.VITE_API_URL;

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

  function getChecklistImageSrcList(images: ReportData['images']): string[] {
    return images
      .map((img) => {
        if (typeof img === 'number' || typeof img === 'string') {
          return `${apiUrl}/api/checklist-image/${img}`;
        }
        if (img && typeof img === 'object' && 'url' in img && img.url) {
          return img.url;
        }
        return '';
      })
      .filter(Boolean);
  }

  useEffect(() => {
    const checkExistingEstimation = async () => {
      try {
        setCheckingEstimation(true);
        const response = await fetch(
          `${apiUrl}/api/check-estimation-exists/${encodeURIComponent(reportData?.Reference || '')}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        
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
    if (!barcodeValue) return;
    setBarcodeBase64(generateBarcodeBase64(barcodeValue));
  }, [barcodeValue]);

useEffect(() => {
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
          building: first.build_id || '',
          unit: first.unit_desc || '',
          tenantCode: first.both || '',
          tenant: first.CTenantName || '',
          contractNo: first.contract_id || '',
          startDate: first.contract_sdate || '',
          endDate: first.contract_edate || '',
          visitType: first.visitType || '',
          submissionDate: first.sysdate,
          tenantSignature: first.tenantSignature || '',
          technicianSignature: first.technicianSignature || '',
          equipment,
          images: first.images || [],
          videos: first.videos || [],
          Reference: first.refNum || '',
        };
        setReportData(mapped);
      } else {
        setReportData(null);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setReportData(null);
    }
  };
  fetchReportData();
}, [Reference]);

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

  const handleSendEmail = async () => {
    const data = reportData;
    if (!data) return;
    try {
      setIsSending(true);
      const { images, videos, ...reportDataWithoutImages } = reportData;
      const payload = {
        reportData: {
          ...reportDataWithoutImages,
          equipment: reportData?.equipment || [], // Always use the latest equipment from backend
        },
        username,
        barcodeBase64,
      };
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

      await fetch(`${import.meta.env.VITE_API_URL}/api/send-report`, {
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
          subject: `${reportData?.visitType} Checklist Report for Your Unit – ${reportData?.building} / ${reportData?.unit}`,
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
  return (
    <EstimationCost
      EstimationCostData={{
        technician: reportData ? reportData.technician : '',
        building: reportData ? reportData.building : '',
        unit: reportData ? reportData.unit : '',
        tenantCode: reportData ? reportData.tenantCode : '',
        tenant: reportData ? reportData.tenant : '',
        contractNo: reportData ? reportData.contractNo : '',
        startDate: reportData ? reportData.startDate : '',
        endDate: reportData ? reportData.endDate : '',
        visitType: reportData ? reportData.visitType : '',
        equipment: reportData ? reportData.equipment : [], // Pass the checklist equipment
        Reference: reportData ? reportData.Reference : '',
        submissionDate: reportData ? reportData.submissionDate : ''
      }}
      onNewChecklist={() => setShowEstimationCost(false)}
      fromHistory={true}
    />
  );
}

  if (!reportData) {
    return <PageLoader />;
  }

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
          {/* Header */}
          <div className="flex items-center justify-between my-4 relative">
            {/* Left spacer */}
            <div className="flex-1" />
            {/* Centered title */}
            <div className="flex items-center justify-center my-4 relative">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-black text-center">
                Checklist Report
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
            <span className="font-mono">{reportData.Reference}</span>
          </div>
          {/* Report Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black bg-white no-wrap-table">
              <tbody>
                {/* Date Row */}
                <tr>
                  <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">
                    Tenant
                  </td>
                  <td className="w-1/2 bg-white p-2 text-xs font-normal text-black border border-black" colSpan={5}>
                    {reportData.tenant}
                  </td>
                </tr>
                {/* Building and Unit Row */}
                <tr>
                  <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">
                    Building
                  </td>
                  <td className="w-1/2 bg-white p-2 text-xs font-normal text-black border border-black" colSpan={5}>
                    {reportData.building}
                  </td>
                </tr>
                {/* Visit Type Row */}
                <tr>
                  <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">
                    Date
                  </td>
                  <td className="w-1/4 bg-white p-2 text-xs font-normal text-black border border-black">
                    {formatDateTimeLong(reportData.submissionDate)}
                  </td>
                  <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">
                    Visit Type
                  </td>
                  <td className="w-1/4 bg-white p-2 text-xs font-normal text-black border border-black">
                    {reportData.visitType}
                  </td>
                </tr>
                {/* Tenant and Contract No Row */}
                <tr>
                  <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">
                    Contract No
                  </td>
                  <td className="w-1/4 bg-white p-2 text-xs font-normal text-black border border-black">
                    {reportData.contractNo}
                  </td>
                  <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">
                    Unit
                  </td>
                  <td className="w-1/4 bg-white p-2 text-xs font-normal text-black border border-black">
                    {reportData.unit}
                  </td>
                </tr>
                {/* Start and End Date Row */}
                <tr>
                  <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">
                    Start
                  </td>
                  <td className="w-1/4 bg-white p-2 text-xs font-normal text-black border border-black">
                    {formatDateShort(reportData.startDate)}
                  </td>
                  <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">
                    End
                  </td>
                  <td className="w-1/4 bg-white p-2 text-xs font-normal text-black border border-black">
                    {formatDateShort(reportData.endDate)}
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
                  <th className="bg-white p-2 text-xs font-bold text-black border border-black w-[10%]">Status</th>
                  <th className="bg-white p-2 text-xs font-bold text-black border border-black w-[30%]">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(reportData?.equipment?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-2 border border-black text-center text-xs sm:text-sm text-black font-bold">
                      Condition All Good
                    </td>
                  </tr>
                ) : (
                  (reportData?.equipment ?? []).map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="px-3 py-2 border border-black text-xs text-black w-[5%] text-center">{idx + 1}</td>
                      <td className="px-3 py-2 border border-black text-xs text-black w-[45%]">{item.itemname}</td>
                      <td className="px-3 py-2 border border-black text-xs text-black text-center w-[5%]">{item.unit}</td>
                      <td className="px-3 py-2 border border-black text-xs text-black w-[5%] text-center">{item.qty}</td>
                      <td className="px-3 py-2 border border-black capitalize text-xs text-black w-[10%] text-center">{item.status}</td>
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
              const srcList = getChecklistImageSrcList(reportData.images);
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
            <span className="font-bold text-black mb-2 text-xs">{reportData.tenant}</span>
            <div className="border-2 border-black rounded-lg bg-white flex items-center justify-center w-40 h-16 mb-2">
              {reportData && reportData.tenantSignature ? (
                <img
                  src={reportData.tenantSignature}
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
              {reportData && reportData.technicianSignature ? (
                <img
                  src={reportData.technicianSignature}
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
        {fromHistory ? (
          <button
            type="button"
            onClick={onNewChecklist}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-blue-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-blue-700 dark:border-gray-600 transition-colors"
          >
            {/* ...back icon... */}
            Back to Checklist History
          </button>
        ) : (
          <button
            type="button"
            onClick={onNewChecklist}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors"
          >
            {/* ...new checklist icon... */}
            New Checklist
          </button>
        )}
        <button
          type="button"
          onClick={handleSendEmail}
          disabled={isSending}
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
          disabled={hasActiveEstimation || checkingEstimation}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-700"
          title={hasActiveEstimation ? 'This checklist already has an active estimation cost' : ''}
        >
          {checkingEstimation ? 'Checking...' : 'Generate Estimation Cost'}
        </button>
      </div>
    </>
  );
}