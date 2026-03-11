import React, { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import JsBarcode from 'jsbarcode';
// import Barcode from 'react-barcode';
import EquipmentSection, { SelectedItem } from '@/components/moveinoutcomponents/EquipmentSection';
import * as ContractAPI from '@/services/Transaction/Contract/Contractapi';
import { canUserAdd } from '@/utils/moduleAccess';
import { formatDateShort } from '@/utils/DateFormat';
import ImageModal from '@/components/moveinoutcomponents/ImageModal';
import VideoModal from '@/components/moveinoutcomponents/VideoModal';
import ValidationPopup from '@/components/ValidationPopup';
import ReportView, { ReportData } from './ReportView';
import '../../styles/Moveinout.css';

interface Building {
  build_id: string;
  build_desc: string;
}
interface Unit {
  unit_desc: string;
}
interface TenantInfo {
  tenantCode: string;
  tenantName: string;
  contractNo: string;
  startDate: string;
  endDate: string;
}

export default function Moveinout(){
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [buildingsearchTerm, setbuildingSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [tenantLoading, setTenantLoading] = useState(false);

  const [barcodeValue, setBarcodeValue] = useState<string>('');
  const [barcodeBase64, setBarcodeBase64] = useState<string>('');

  const [checklistType, setChecklistType] = useState('moveIn');
  
  const [selectedEquipment, setSelectedEquipment] = useState<SelectedItem[]>([]);

  const [currentView, setCurrentView] = useState<'form' | 'tenantSignature' | 'technicianSignature' | 'report'>('form');
  const [tenantSignature, setTenantSignature] = useState('');
  // const [technicianSignature, setTechnicianSignature] = useState('');
  const tenantSigRef = useRef<SignatureCanvas>(null);
  const technicianSigRef = useRef<SignatureCanvas>(null);

  const [images, setImages] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // const [isSubmitted, setIsSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // const hasAccess = hasModuleAccess('moveinout');
  const canAdd = canUserAdd('Move &In Register');

  const username = sessionStorage.getItem('username')

  // Reusable error handler
  const handleError = (err: unknown, operation: string) => {
    const errorMessage = `Failed to ${operation}`;
    setErrors(prev => [...prev, errorMessage]); // Add to existing errors
  };

  function generateBarcodeBase64(value: string): string {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, value, { format: 'CODE128', width: 2, height: 40, displayValue: false });
  return canvas.toDataURL('image/png');
  }

  function getRefNum(data: ReportData) {
    // Use only numbers and letters, no spaces or special characters
    const safe = (str: string) => (str || '').replace(/[^a-zA-Z0-9]/g, '');
    const date = new Date(data.submissionDate);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const refDate =
      pad(date.getDate()) +
      pad(date.getMonth() + 1) +
      date.getFullYear() +
      pad(date.getHours()) +
      pad(date.getMinutes());
    // technician, building, unit, refdate
    return (
      //safe(data.technician) +
      //safe(data.visitType) +
      safe(data.contractNo + data.building + data.unit) +
      refDate
    );
  }

  // Navigation handlers
  const handleNext = () => {
    if (currentView === 'form') {
      // Validate required fields
      const errors: string[] = [];
      
      if (!selectedBuilding) {
        errors.push('Building is required');
      }
      
      if (!selectedUnit) {
        errors.push('Unit is required');
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        setShowValidationPopup(true);
        return; // Don't proceed to next step
      }
      
      setCurrentView('tenantSignature');
    } else if (currentView === 'tenantSignature') {
      const errors: string[] = [];
      if (tenantSigRef.current && tenantSigRef.current.isEmpty()) {
      errors.push('Tenant signature is required');
      }
      if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationPopup(true);
      return; // Don't proceed to next step
      }
      // Save tenant signature before moving to technician
      saveSignature('tenant');
      setCurrentView('technicianSignature');
      // Clear technician canvas when entering technician signature view
      setTimeout(() => {
        if (technicianSigRef.current) {
          technicianSigRef.current.clear();
        }
      }, 100);
    }
  };
  const handleBack = () => {
    if (currentView === 'technicianSignature') {
      // Clear technician signature when going back to tenant signature
      if (technicianSigRef.current) {
        technicianSigRef.current.clear();
      }
      // setTechnicianSignature('');
      setCurrentView('tenantSignature');
    } else if (currentView === 'tenantSignature') {
      // Clear tenant signature when going back to form
      if (tenantSigRef.current) {
        tenantSigRef.current.clear();
      }
      setTenantSignature('');
      setCurrentView('form');
    }
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
    setLoading(true);
    try {    
    // Save technician signature and submit form
    const technicianSignatureDataURL = technicianSigRef.current
      ? technicianSigRef.current.toDataURL()
      : '';
    
    // Prepare report data
    const baseSubmissionData: ReportData = {
      building: selectedBuilding,
      building_desc: buildingsearchTerm,
      unit: selectedUnit || 'N/A',
      tenantCode: tenantInfo?.tenantCode || 'N/A',
      tenant: tenantInfo?.tenantName || 'N/A',
      technician: username || '',
      contractNo: tenantInfo?.contractNo || 'N/A',
      startDate: tenantInfo?.startDate ?? '',
      endDate: tenantInfo?.endDate ?? '',
      visitType: checklistType === 'moveIn' ? 'Move In' : 'Move Out',
      submissionDate: new Date(),
      tenantSignature,
      technicianSignature: technicianSignatureDataURL,
      images: images,
      videos: videos,
      equipment: selectedEquipment,
      Reference: '' // Placeholder, will be set below
    };
    const submissionData = {
  ...baseSubmissionData,
  Reference: getRefNum(baseSubmissionData)
  };
    const barcodeValue = `${submissionData.visitType}-${submissionData.contractNo}-${formatDateShort(submissionData.submissionDate)}`;
    const barcodeBase64 = generateBarcodeBase64(barcodeValue);
    const checklistPayload = {
      contract: submissionData.contractNo, // or submissionData.contract
      visitType: submissionData.visitType,
      equipment: JSON.stringify(selectedEquipment),  // if equipment is an array/object
      barcode: barcodeValue,
      tenantsignature: submissionData.tenantSignature,
      techniciansignature: submissionData.technicianSignature,
      username: username ?? '',
      tenantCode: submissionData.tenantCode || '',
      tenantName: submissionData.tenant,
      building: submissionData.building,
      unit: submissionData.unit,
      date: submissionData.submissionDate,
      startDate: submissionData.startDate,
      endDate: submissionData.endDate,
      refNum: submissionData.Reference
    };

    setBarcodeValue(barcodeValue);
    setBarcodeBase64(barcodeBase64);
    
    // Set report data
    setReportData(submissionData);
    
    // console.log('Form submitted successfully!', submissionData);
    await ContractAPI.saveChecklist({
      ...checklistPayload,
      images,
      videos
    });
    setReportData(submissionData);
    setCurrentView('report');
    // Optionally show a success message
  } catch {
    setValidationErrors(['Failed to save checklist.']);
    setShowValidationPopup(true);
  } finally {
    setLoading(false);
  }
  };

    // Filter buildings based on search term
  const filteredBuildings = buildings.filter(building =>
    building.build_desc.toLowerCase().includes(buildingsearchTerm.toLowerCase())
  );
  // Filter units based on search term
  const filteredUnits = units.filter(unit =>
    unit.unit_desc.toLowerCase().includes(unitSearchTerm.toLowerCase())
  );

  // Fetch buildings
  useEffect(() => {
    const fetchBuildings = async () => {
      setLoading(true);
      try {
        const data = await ContractAPI.getBuildings();
        setBuildings(data.buildings);
      } catch (err) {
        handleError(err, 'fetch buildings');
      } finally {
        setLoading(false);
      }
    };
    fetchBuildings();
  }, []);
  // Fetch units when building is selected
  useEffect(() => {
    const fetchUnits = async () => {
      if (selectedBuilding) {
        setLoading(true);
        try {
          const data = await ContractAPI.getUnits(selectedBuilding);
          // console.log(selectedBuilding) // Pass building ID
          setUnits(data.units); // Access units from the response
        } catch (err) {
          handleError(err, 'fetch units');
        } finally {
          setLoading(false);
        }
      } else {
        setUnits([]);
        setSelectedUnit('');
        setUnitSearchTerm('');
      }
    };
    fetchUnits();
  }, [selectedBuilding]);
  // Auto populate tenant info
  useEffect(() => {
    const fetchTenantInfo = async () => {
      if (selectedBuilding && selectedUnit) {
        setTenantLoading(true);
        try {
          const data = await ContractAPI.getTenantInfo(selectedBuilding, selectedUnit);
          // console.log(selectedBuilding, selectedUnit);
          setTenantInfo({
            tenantCode: data.tenantCode,
            tenantName: data.tenantName,
            contractNo: data.contractNo,
            startDate: data.startDate,
            endDate: data.endDate
          });
        } catch (err) {
          handleError(err, 'fetch tenant information');
          setTenantInfo(null);
        } finally {
          setTenantLoading(false);
        }
      } else {
        setTenantInfo(null);
      }
    };

    fetchTenantInfo();
  }, [selectedBuilding, selectedUnit]);

    // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
  window.scrollTo(0, 0);
  }, [currentView]);

  const handleBuildingSelect = (building: Building) => {
    setSelectedBuilding(building.build_id);
    setbuildingSearchTerm(building.build_desc);
    setIsDropdownOpen(false);
  };
  const handleUnitSelect = (unit: Unit) => {
    setSelectedUnit(unit.unit_desc);
    setUnitSearchTerm(unit.unit_desc);
    setIsUnitDropdownOpen(false);
  };
  const handleBuildingSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setbuildingSearchTerm(e.target.value);
    setIsDropdownOpen(true);
    setSelectedBuilding(''); // Clear selection when typing
  };
  const handleUnitSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUnitSearchTerm(e.target.value);
    setIsUnitDropdownOpen(true);
    setSelectedUnit('');
  };

  const handleChecklistTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChecklistType(e.target.value);
  };

    // Signature handling functions
  const clearSignature = (signatureType: 'tenant' | 'technician') => {
    const sigRef = signatureType === 'tenant' ? tenantSigRef : technicianSigRef;
    if (sigRef.current) {
      sigRef.current.clear();
    }
    
    if (signatureType === 'tenant') {
      setTenantSignature('');
    } else {
      // setTechnicianSignature('');
    }
  };
  const saveSignature = (signatureType: 'tenant' | 'technician') => {
    const sigRef = signatureType === 'tenant' ? tenantSigRef : technicianSigRef;
    if (sigRef.current) {
      const dataURL = sigRef.current.toDataURL();
      
      if (signatureType === 'tenant') {
        setTenantSignature(dataURL);
      } else {
        // setTechnicianSignature(dataURL);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files].slice(0, 10)); // Max 10 images
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setVideos(prev => [...prev, ...files].slice(0, 10)); // Max 10 videos
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

const handleNewChecklist = () => {
  // Reset form to start new checklist
  setCurrentView('form');
  setSelectedBuilding('');
  setSelectedUnit('');
  setSelectedEquipment([]);
  setbuildingSearchTerm('');
  setUnitSearchTerm('');
  setTenantInfo(null);
  setChecklistType('moveIn');
  setImages([]);
  setVideos([]);
  setTenantSignature('');
  // setTechnicianSignature('');
  setReportData(null);
  setValidationErrors([]);         // <-- Add this line
  setShowValidationPopup(false);   // <-- Add this line
  setErrors([]);                   // <-- Optionally clear general errors too
};

// Reusable signature component
const renderSignatureView = (signatureType: 'tenant' | 'technician') => {
  const sigRef = signatureType === 'tenant' ? tenantSigRef : technicianSigRef;
  // Get selected building and unit names
  const selectedBuildingName = buildings.find(b => b.build_id === selectedBuilding)?.build_desc || '';
  const selectedUnitName = selectedUnit;
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6 border border-gray-300 dark:border-gray-600 rounded-lg">
      {/* Header */}
      <div className="text-center border-b border-gray-300 dark:border-gray-600 pb-4">
        <h2 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
         {signatureType === 'tenant' ? 'Tenant Signature' : 'Technician Signature'}
        </h2>
        <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
          {checklistType === 'moveIn' ? 'Move In' : 'Move Out'} Checklist Summary
        </h1>
      </div>
      {/* Row 1: Building and Unit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Building:</label>
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{selectedBuildingName || 'Not selected'}</span>
        </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit:</label>
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{selectedUnitName || 'Not selected'}</span>
          </div>
      </div>
      {/* Row 2: Tenant Name and Contract No */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tenant Name:</label>
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{tenantInfo?.tenantName || 'N/A'}</span>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contract No:</label>
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">{tenantInfo?.contractNo || 'N/A'}</span>
        </div>
      </div>
      {/* Row 3: Start Date and End Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date:</label>
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {formatDateShort(tenantInfo?.startDate)}
          </span>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date:</label>
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {formatDateShort(tenantInfo?.endDate)}
          </span>
        </div>
      </div>
      {/* Row 4: Visit Type */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Visit Type:</label>
          <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {checklistType === 'moveIn' ? 'Move In' : 'Move Out'}
          </span>
        </div>
      </div>
      {/* Row 5: Checklist Summary Table */}
      <div className="mt-6 mb-6 border border-gray-300 dark:border-gray-600 rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden no-wrap-table">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr className="bg-white dark:bg-gray-800">
                <th className="px-2 py-2 border border-gray-300 dark:border-gray-600 text-left text-xs sm:text-sm">SI No</th>
                <th className="px-2 py-2 border border-gray-300 dark:border-gray-600 text-left text-xs sm:text-sm">Item Name</th>
                <th className="px-2 py-2 border border-gray-300 dark:border-gray-600 text-left text-xs sm:text-sm">Unit</th>
                <th className="px-2 py-2 border border-gray-300 dark:border-gray-600 text-left text-xs sm:text-sm">QTY</th>
                <th className="px-2 py-2 border border-gray-300 dark:border-gray-600 text-left text-xs sm:text-sm">Status</th>
                <th className="px-2 py-2 border border-gray-300 dark:border-gray-600 text-left text-xs sm:text-sm">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {selectedEquipment.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-2 border border-black text-center text-xs sm:text-sm text-black font-bold">
                    Condition All Good
                  </td>
                </tr>
              ) : (
              selectedEquipment.map((item, idx) => (
                <tr key={item.id} className="bg-white dark:bg-gray-800">
                  <td className="px-2 py-2 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm">{idx + 1}</td>
                  <td className="px-2 py-2 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm">{item.itemname}</td>
                  <td className="px-2 py-2 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm">{item.unit}</td>
                  <td className="px-2 py-2 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm">{item.qty}</td>
                  <td className="px-2 py-2 border border-gray-300 dark:border-gray-600 capitalize text-xs sm:text-sm">{item.status}</td>
                  <td className="px-2 py-2 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm">{item.remarks}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Row 6: Signature Canvas */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          {signatureType === 'tenant' ? 'Tenant' : 'Technician'} Signature:
        </label>
        <div className="border-2 border-dashed border-gray-400 dark:border-gray-500 rounded-lg p-4 bg-grey-600 dark:bg-gray-700">
          <div className="w-full overflow-x-auto">
            <SignatureCanvas
              ref={sigRef}
              penColor="blue"
              canvasProps={{
                width: 600,
                height: 200,
                className: 'signature-pad mx-auto'
              }}
              backgroundColor="white"
              />
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Draw your signature above
          </p>
        </div>
      </div>
      {/* Row 6: Action Buttons */}
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
              handleSubmit(); // Use handleSubmit for technician signature
            } else {
              handleNext(); // Use handleNext for tenant signature (with validation)
            }
          }} 
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors"
          disabled={loading}
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
              {loading ? 'Submitting...' : 'Submit'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
      <ValidationPopup
        isOpen={showValidationPopup}
        onClose={() => setShowValidationPopup(false)}
        errors={validationErrors}
      />
    </div>
  );
}; 

const renderFormView = () => {
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 dark:text-red-200 font-medium">
                {errors.length === 1 ? 'Error' : 'Errors'}
              </span>
            </div>
            <button
              onClick={() => setErrors([])} // Clear all errors
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ✕
            </button>
          </div>
          <div className="mt-1">
            {errors.map((error, index) => (
              <p key={index} className="text-red-700 dark:text-red-300">
                • {error}
              </p>
            ))}
          </div>
        </div>
      )}
      {/* Title/Header */}
      <div className="text-center border-b border-gray-300 dark:border-gray-600 pb-4">
        <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
          {checklistType === 'moveIn' ? 'Move In Checklist' : 'Move Out Checklist'}
        </h1>
        {/* <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {checklistType === 'moveIn' 
            ? 'Property inspection and tenant move-in documentation' 
            : 'Property inspection and tenant move-out documentation'
          }
        </p> */}
      </div>
      {/* Row 1: Buildings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col relative" ref={dropdownRef}>
          <label className="font-semibold mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Building</label>
          <div className="relative">
            <input
              type="text"
              value={buildingsearchTerm}
              onChange={handleBuildingSearchChange}
              disabled={loading} 
              onFocus={() => setIsDropdownOpen(true)}
              placeholder={loading ? 'Loading buildings...' : 'Search or select a building...'}
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full pr-8"
            />
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>          
            {/* Dropdown */}
            {isDropdownOpen && !loading && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredBuildings.length > 0 ? (
                  filteredBuildings.map((building) => (
                    <button
                      key={building.build_id}
                      type="button"
                      onClick={() => handleBuildingSelect(building)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white first:rounded-t-lg last:rounded-b-lg"
                    >
                      {building.build_desc}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                    No buildings found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Row 1.2: Units */}
        <div className="flex flex-col relative">
          <label className="font-semibold mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Unit</label>
          <div className="relative">
            <input
              type="text"
              value={unitSearchTerm}
              onChange={handleUnitSearchChange}
              disabled={!selectedBuilding || loading}
              onFocus={() => selectedBuilding && !loading ? setIsUnitDropdownOpen(true) : null}
              placeholder={!selectedBuilding ? 'Select a building first...' : 'Search or select a unit...'}
              className={`border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full pr-8 placeholder-gray-500 dark:placeholder-gray-400 ${
              (!selectedBuilding || loading)
                ? 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-text'
              }`}
            />
            <button
              type="button"
              onClick={() => selectedBuilding && !loading ? setIsUnitDropdownOpen(!isUnitDropdownOpen) : null}
              disabled={!selectedBuilding || loading}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                (!selectedBuilding || loading)
                  ? 'text-gray-300 dark:text-gray-500 cursor-not-allowed opacity-50'
                  : 'text-gray-400 hover:text-gray-600 cursor-pointer'
              }`}
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            </button>         
            {/* Units Dropdown */}
            {isUnitDropdownOpen && selectedBuilding && !loading && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredUnits.length > 0 ? (
                  filteredUnits.map((unit) => (
                    <button
                      key={unit.unit_desc}
                      type="button"
                      onClick={() => handleUnitSelect(unit)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white first:rounded-t-lg last:rounded-b-lg"
                      >
                      {unit.unit_desc}
                    </button>
                  ))
                ) : (
                <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                  No units found
                </div>
                )}
            </div>
            )}
          </div>
        </div>
      </div>
      {/* Row 2: Tenant Information */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
        {tenantLoading ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            Loading tenant information...
          </div>
        ) : tenantInfo ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tenant:</label>
              <span className="text-gray-800 dark:text-gray-200">{tenantInfo.tenantName || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contract:</label>
              <span className="text-gray-800 dark:text-gray-200">{tenantInfo.contractNo || 'N/A'}</span>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date:</label>
              <span className="text-gray-800 dark:text-gray-200">
                {formatDateShort(tenantInfo?.startDate)}
              </span>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date:</label>
              <span className="text-gray-800 dark:text-gray-200">
                {formatDateShort(tenantInfo?.endDate)}
              </span>
            </div>
          </div>
        ) : selectedBuilding && selectedUnit ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            No active contract found for this unit
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            Select a building and unit to view tenant information
          </div>
        )}
      </div>
      {/* Row 3: Checklist Type */}
      <div className="flex flex-col">
        <label className="font-semibold mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Checklist Type</label>
        <div className="flex flex-col sm:flex-row gap-3 p-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="checklistType"
              value="moveIn"
              checked={checklistType === 'moveIn'}
              onChange={handleChecklistTypeChange}
              className="text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Move In</span>
          </label>
          <label className="font-semibold flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="checklistType"
              value="moveOut"
              checked={checklistType === 'moveOut'}
              onChange={handleChecklistTypeChange}
              className="text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Move Out</span>
          </label>
        </div>
      </div>
      {/* Row 4: Equipment Section */}
      <EquipmentSection 
        selectedBuilding={selectedBuilding}
        selectedUnit={selectedUnit}
        selectedItems={selectedEquipment}
        onEquipmentChange={setSelectedEquipment}
      />
      {/* Row 5: Attachment and Next Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          type="button"
          onClick={() => setShowImageModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors relative"
          >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Attach Image
          {images.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {images.length}
            </span>
          )}
        </button>        
        <button
          type="button"
          onClick={() => setShowVideoModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors relative"
          >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Attach Video
          {videos.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {videos.length}
            </span>
          )}
        </button>
        {canAdd && (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors sm:min-w-[120px]"
            disabled={tenantLoading}
            >
        {tenantLoading ? (
          <>
            <svg className="animate-spin w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            Loading...
          </>
        ) : (
          <>
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
          </button>
        )}
      </div>
    </div>
    );
  };
  // Main render - conditionally show the correct view
  if (currentView === 'form') {
    return (
      <>
        {renderFormView()}
        <ValidationPopup
          isOpen={showValidationPopup}
          onClose={() => setShowValidationPopup(false)}
          errors={validationErrors}
          title="Required Fields Missing"
          message="Please complete the following before proceeding:"
          confirmButtonText="OK"
          confirmButtonColor="green"
        />
        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          images={images}
          onImageSelect={handleImageSelect}
          onRemoveImage={removeImage}
        />
        <VideoModal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          videos={videos}
          onVideoSelect={handleVideoSelect}
          onRemoveVideo={removeVideo}
        />
      </>
    );
  } else if (currentView === 'tenantSignature') {
    return renderSignatureView('tenant');
  } else if (currentView === 'technicianSignature') {
    return renderSignatureView('technician');
  } else if (currentView === 'report') {
    return reportData ? (
      <ReportView
        Reference={reportData.Reference}
        // reportData={reportData}
        onNewChecklist={handleNewChecklist}
        barcodeValue={barcodeValue}
        barcodeBase64={barcodeBase64}
      />
    ) : null;
  }
};  