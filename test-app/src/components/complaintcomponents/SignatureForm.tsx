import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import JsBarcode from 'jsbarcode';
import ValidationPopup from '@/components/ValidationPopup';
import { insertComplaintDetails } from '@/services/Transaction/Contract/Contractapi';
import TechnicianView from '@/pages/moveinout/technician/TechnicianView';
import CheckListView from '@/pages/maintenance/CheckListView';

interface SignatureFormProps {
  complaint: any;
 // onNewChecklist: () => void;
 onBack?: (data: any) => void;
}

export default function SignatureForm({ complaint, onBack }: SignatureFormProps) {
  const [currentView, setCurrentView] = useState<'tenantSignature' | 'technicianSignature' | 'report'>('tenantSignature');
  const [tenantSignature, setTenantSignature] = useState('');
  const [technicianSignature, setTechnicianSignature] = useState('');
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [barcodeValue, setBarcodeValue] = useState<string>('');
  const [barcodeBase64, setBarcodeBase64] = useState<string>('');
  const tenantSigRef = useRef<SignatureCanvas>(null);
  const technicianSigRef = useRef<SignatureCanvas>(null);
  const [showTechnicianView, setShowTechnicianView] = useState(false);
  const [reference, setReference] = useState<string>('');
  const isBranch = !complaint.CTenantName;
  //console.log('Received complaint data in SignatureForm:', complaint);
  //console.log('Complaint data in SignatureForm:', complaint.complaintType);
  //console.log("isbranch:", isBranch);

  // Generate barcode as base64
  function generateBarcodeBase64(value: string): string {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, value, { format: 'CODE128', width: 2, height: 40, displayValue: false });
    return canvas.toDataURL('image/png');
  }

  // Handle Next (from tenant to technician signature)
  const handleNext = () => {
    const errors: string[] = [];
    if (tenantSigRef.current && tenantSigRef.current.isEmpty()) {
      errors.push('Tenant signature is required');
    }
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationPopup(true);
      return;
    }
    setTenantSignature(tenantSigRef.current?.toDataURL() || '');
    setCurrentView('technicianSignature');
    setTimeout(() => {
      if (technicianSigRef.current) technicianSigRef.current.clear();
    }, 100);
  };

  const handleSubmit = async () => {
  const errors: string[] = [];
  if (technicianSigRef.current && technicianSigRef.current.isEmpty()) {
    errors.push('Technician signature is required');
  }
  if (errors.length > 0) {
    setValidationErrors(errors);
    setShowValidationPopup(true);
    return;
  }
  const technicianSignatureDataURL = technicianSigRef.current?.toDataURL() || '';
  setTechnicianSignature(technicianSignatureDataURL);

  // Prepare the payload for backend
  const submissionDate = new Date();
  const refNum = complaint?.complaintNum || '';
  const visitType = "Complaint";
  const barcodeVal = `${visitType}-${refNum}-${submissionDate.toISOString().slice(0, 10)}`;
  const barcodeImg = generateBarcodeBase64(barcodeVal);

  // Prepare details for each item
  //console.log('Preparing details with complaint data:', complaint);
  const details = (complaint?.itemRows || []).map((item: any, idx: number) => ({
  complaint_id: complaint.complaint_id,
  complaintNum: complaint.complaintNum,
  build_id: complaint.build_id,
  build_desc: complaint.build_desc,
  unit_desc: complaint.unit_desc,
  block: complaint.block,
  both: complaint.both,
  CTenantName: complaint.CTenantName,
  contract_id: complaint.contract_id,
  contract_sdate: complaint.contract_sdate,
  contract_edate: complaint.contract_edate,
  type: complaint.type,
  status: complaint.status,
  category: item.categoryValue,
  remarks: item.remarks,
  auditrev: complaint.auditrev,
  userid: complaint.userid,
  Date: complaint.Date || submissionDate.toISOString(),
  sysdate: submissionDate.toISOString(),
  //subComp_id: item.itemValue,
  itemname: item.itemLabel || item.itemname,
  itemno: item.itemno || item.itemValue,
  qty: item.quantity || item.qty,
  barcode: barcodeVal,
  tenantsignature: tenantSignature,
  techniciansignature: technicianSignatureDataURL,
  brdcode: item.brdcode || '',
  subcode: item.subcode || '',
  unit: item.unit || '',
  counter: idx + 1, // <-- Add this line for incrementing counter
  // Add other fields as needed
}));
  //console.log('Prepared details for submission:', details);
  // Send each item as a separate detail (or batch if your backend supports)
  for (const detail of details) {
    await insertComplaintDetails(detail);
  }
  //console.log('Inserted complaint details:', details);
  //console.log('reportdata for technician view:',complaint)
  // Prepare reportData for TechnicianView
const report = {
  ...complaint,
  tenant: complaint.CTenantName || '', // <-- add this
  building: complaint.build_desc || '', // <-- add this
  unit: complaint.unit_desc || '',      // <-- add this
  contractNo: complaint.contract_id || '',
  startDate: complaint.contract_sdate || complaint.startDate || '',
  endDate: complaint.contract_edate || complaint.endDate || '',
  submissionDate,
  tenantsignature: tenantSignature,
  techniciansignature: technicianSignatureDataURL,
  Reference: refNum,
  barcodeValue: barcodeVal,
  barcodeBase64: barcodeImg,
  place_desc: complaint.place_desc || '',
  unitNature: complaint.unitNature || '',
  unit_master_desc: complaint.unit_master_desc || '',
  items: details.map((d: any) => ({
    itemname: d.itemname,
    itemno: d.itemno,
    qty: d.qty,
    remarks: d.remarks,
    unit: d.unit,
  })),
  
};

  setBarcodeValue(barcodeVal);
  setBarcodeBase64(barcodeImg);
  setReportData(report);
  setReference(refNum);
  setShowTechnicianView(true);
};

  // Handle Back
// const handleBack = () => {
//   if (currentView === 'technicianSignature') {
//     if (technicianSigRef.current) technicianSigRef.current.clear();
//     setCurrentView('tenantSignature');
//   } else if (currentView === 'report') {
//     setCurrentView('technicianSignature');
//   }
//   // Add more cases if you have other views
// };

const handleBack = () => {
  if (currentView === 'technicianSignature') {
    if (technicianSigRef.current) technicianSigRef.current.clear();
    setCurrentView('tenantSignature');
    // Do NOT call onBack here, since you want to stay in SignatureForm
    return;
  }
  // If you want to go back to ComplaintForm from tenantSignature, call onBack
  if (currentView === 'tenantSignature' && onBack) {
    const dataToReturn = {
      ...complaint,
      tenantSignature,
      technicianSignature,
      // Add any other fields you want to preserve
    };
    onBack(dataToReturn);
  }
};

  const clearSignature = (signatureType: 'tenant' | 'technician') => {
  const sigRef = signatureType === 'tenant' ? tenantSigRef : technicianSigRef;
  if (sigRef.current) sigRef.current.clear();
  if (signatureType === 'tenant') setTenantSignature('');
  else setTechnicianSignature('');
};



  // Render signature step
  const renderSignatureView = (signatureType: 'tenant' | 'technician') => (
    <div className="max-w-4xl mx-auto bg-white border rounded-lg shadow-sm p-6 space-y-6">
      <div className="text-center border-b pb-4">
        <p className="text-sm text-gray-600">
           {signatureType === 'tenant'
    ? (isBranch ? 'Branch Signature:' : 'Tenant Signature:')
    : 'Technician Signature:'}

        </p>
        <h2 className="text-xl font-bold">Complaint Summary</h2>
      </div>
      {/* Complaint Info */}
      <div className="grid grid-cols-2 gap-4 border rounded p-4">
  <div>
    <p className="text-sm text-gray-500">Building:</p>
    <p className="font-semibold">{complaint?.build_desc || complaint?.building}</p>
  </div>
  <div>
    <p className="text-sm text-gray-500">Unit:</p>
    <p className="font-semibold">{complaint?.selectedUnit || complaint?.unit_desc}</p>
  </div>
</div>
{/* Only show these if not a branch complaint */}
{complaint.CTenantName && (
  <>
    <div className="grid grid-cols-2 gap-4 border rounded p-4">
      <div>
        <p className="text-sm text-gray-500">Tenant Name:</p>
        <p className="font-semibold">{complaint?.CTenantName}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500">Contract No:</p>
        <p className="font-semibold">{complaint?.contract_id}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4 border rounded p-4">
      <div>
        <p className="text-sm text-gray-500">Start Date:</p>
        <p className="font-semibold">{complaint?.contract_sdate}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500">End Date:</p>
        <p className="font-semibold">{complaint?.contract_edate}</p>
      </div>
    </div>
  </>
)}
      <div className="border rounded p-4">
        <p className="text-sm text-gray-500">Description:</p>
        <p className="font-semibold">{complaint?.description}</p>
      </div>
      {/* Item Rows */}
      {complaint?.itemRows?.length > 0 && (
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">Sl No</th>
                <th className="border px-3 py-2 text-left">Item Name</th>
                <th className="border px-3 py-2 text-left">QTY</th>
                <th className="border px-3 py-2 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {complaint.itemRows.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="border px-3 py-2">{index + 1}</td>
                  <td className="border px-3 py-2">{item.itemLabel || item.itemname}</td>
                  <td className="border px-3 py-2">{item.quantity || item.qty}</td>
                  <td className="border px-3 py-2">{item.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Signature Area */}
      <div className="border rounded p-4 bg-gray-50">
        <p className="text-sm mb-2">
  {signatureType === 'tenant'
    ? (isBranch ? 'Branch Signature:' : 'Tenant Signature:')
    : 'Technician Signature:'}
</p>
        <div className="border-2 border-dashed rounded p-4 bg-white flex justify-center">
          <SignatureCanvas
            ref={signatureType === 'tenant' ? tenantSigRef : technicianSigRef}
            penColor="blue"
            canvasProps={{
              width: 600,
              height: 200,
              className: 'signature-pad'
            }}
          />
        </div>
        <p className="text-center text-sm text-gray-500 mt-2">
          Draw your signature above
        </p>
      </div>
      {/* Buttons */}
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
  <button
    type="button"
    onClick={() => clearSignature(signatureType)}
    className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-red-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-red-700 dark:border-gray-600 transition-colors"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
    Clear Signature
  </button>
  <button
    type="button"
    onClick={handleBack}
    className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
    Back
  </button>
  <button
    type="button"
    onClick={() => {
      if (signatureType === 'technician') {
        handleSubmit();
      } else {
        handleNext();
      }
    }}
    className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors"
  >
    {signatureType === 'tenant' ? (
      <>
        Next
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </>
    ) : (
      <>
        Submit
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </>
    )}
  </button>
</div>
    </div>
  );

  // Render report view
  if (currentView === 'report') {
    return (
      <div className="max-w-2xl mx-auto bg-white border rounded-lg shadow-sm p-6 space-y-6">
        <h2 className="text-xl font-bold text-center">Complaint Submitted</h2>
        <div className="text-center">
          <img src={barcodeBase64} alt="Barcode" className="mx-auto mb-4" />
          <p className="font-semibold">Reference: {barcodeValue}</p>
        </div>
        <button
          //onClick={onNewChecklist}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          New Complaint
        </button>
      </div>
    );
  }

  if (showTechnicianView && reportData) {
    // console.log('showTechnicianView is true and reportData is available',showTechnicianView, reportData);
    //  console.log('Rendering TechnicianView with reportData:', reportData)
  return (

    <CheckListView
      Reference={reference}
      reportData={reportData}
      onNewChecklist={() => window.location.reload()}
      barcodeValue={barcodeValue}
      barcodeBase64={barcodeBase64}
    />
  );
}

  return (
    <>
      <ValidationPopup
        isOpen={showValidationPopup}
        onClose={() => setShowValidationPopup(false)}
        errors={validationErrors}
        title="Required Fields Missing"
        confirmButtonText="OK"
        confirmButtonColor="red"
      />
      {currentView === 'tenantSignature'
        ? renderSignatureView('tenant')
        : renderSignatureView('technician')}
    </>
  );
}