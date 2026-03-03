import React, { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import JsBarcode from 'jsbarcode';
// import Barcode from 'react-barcode';
import EquipmentSection, { SelectedItem } from '@/components/moveinoutcomponents/EquipmentSection';
import * as ContractAPI from '@/services/Transaction/Contract/Contractapi';
import { canUserAdd } from '@/utils/moduleAccess';
import { formatDateShort } from '@/utils/DateFormat';
import ImageModal from '../../components/moveinoutcomponents/ImageModal';
import VideoModal from '../../components/moveinoutcomponents/VideoModal';
import ValidationPopup from '@/components/ValidationPopup';
import ReportView, { ReportData } from '../moveinout/ReportView';
// import '@/styles/Moveinout.css'
import axios from 'axios';
import FormFilter from './FormFilter';
import ComplaintReportView from './ComplaintReportView';

interface Building {
  build_id: string;
  build_desc: string;
}
interface Unit {
  unit_desc: string;
}
interface TenantInfo {
  tenantName: string;
  contractNo: string;
  startDate: string;
  endDate: string;
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
  submissionDate: string;
  description: string;
  images: (File | string | ComplaintImage)[];
  videos: (File | string | ComplaintImage)[];
  username: string;
  status: string;
  equipment: {
    roomType?: string;
    category?: string;
    equipment: string;
    remarks: string;
  }[];
  both: string;
  build_id: string;
  unit_desc: string;
  referenceNumber: string;
}
type TenantContract = {
  contract_id: string;
  build_id: string;
  build_desc: string;
  unit_desc: string;
  contract_sdate?: string;
  contract_edate?: string;
  contract_date?: string;
};
export default function ComplaintForm(){
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
  
  const [reportData, setReportData] = useState<ComplaintReportData | null>(null);

  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // const [isSubmitted, setIsSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [description, setDescription] = useState('');

  // const hasAccess = hasModuleAccess('moveinout');
  const canAdd = canUserAdd('Move &In Register');

  const username = sessionStorage.getItem('username')

  
  const [tenantDetails, setTenantDetails] = useState<any>(null);

  const [filterResetKey, setFilterResetKey] = useState(0);

  
  

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
      
      // if (images.length < 5) {
      //   errors.push('Minimum 5 images are required');
      // }
      
      // if (videos.length < 5) {
      //   errors.push('Minimum 5 videos are required');
      // }
      
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

// const handleSubmit = async () => {
//   setLoading(true);
//   try {
//     // Use tenantDetails for accurate info
//     const complaintData = {
//       building: tenantDetails?.build_desc || '',
//       unit: tenantDetails?.unit_desc || '',
//       tenant: tenantDetails?.CTenantName || '',
//       contractNo: tenantDetails?.contract_id || '',
//       startDate: tenantDetails?.contract_sdate || '',
//       endDate: tenantDetails?.contract_edate || '',
//       submissionDate: new Date().toISOString(),
//       description,
//       images,
//       videos,
//       username: username ?? '',
//       status: "pending",
//       equipment: selectedEquipment.map(item => ({
//         roomType: item.roomType,
//         category: item.category,
//         equipment: item.itemname,
//         remarks: item.remarks,
//       })),
//       both: tenantDetails?.both || '',
//       build_id: tenantDetails?.build_id || '',
//       unit_desc: tenantDetails?.unit_desc || '',
//       referenceNumber: '', // Add a default or generated reference number here
//     };

//     await axios.post(`${import.meta.env.VITE_API_URL}/api/complaints`, complaintData);

//     setReportData(complaintData);
//     setCurrentView('report');
//     setSelectedEquipment([]);
//     setFilterResetKey(prev => prev + 1);
//     setDescription('');

// // Show the form again
// //setCurrentView('form');
//   } catch {
//     setValidationErrors(['Failed to save complaint.']);
//     setShowValidationPopup(true);
//   } finally {
//     setLoading(false);
//   }
// };

    // Filter buildings based on search term
  
    const handleSubmit = async () => {
  setLoading(true);
  try {
    const formData = new FormData();
    formData.append('building', tenantDetails?.build_desc || '');
    formData.append('unit', tenantDetails?.unit_desc || '');
    formData.append('tenant', tenantDetails?.CTenantName || '');
    formData.append('contractNo', tenantDetails?.contract_id || '');
    formData.append('startDate', tenantDetails?.contract_sdate || '');
    formData.append('endDate', tenantDetails?.contract_edate || '');
    formData.append('submissionDate', new Date().toISOString());
    formData.append('description', description);
    formData.append('username', username ?? '');
    formData.append('status', 'pending');
    formData.append('both', tenantDetails?.both || '');
    formData.append('build_id', tenantDetails?.build_id || '');
    formData.append('unit_desc', tenantDetails?.unit_desc || '');
    formData.append('referenceNumber', '');

    // Append equipment as JSON string
    formData.append('equipment', JSON.stringify(selectedEquipment.map(item => ({
      roomType: item.roomType,
      category: item.category,
      equipment: item.itemname,
      remarks: item.remarks,
    }))));

    // Append images and videos
    images.forEach(img => formData.append('images', img));
    videos.forEach(vid => formData.append('videos', vid));

    console.log('Images before submit:', images);
    console.log('Videos before submit:', videos);

    await axios.post(`${import.meta.env.VITE_API_URL}/api/complaints`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    setReportData(null);
    setCurrentView('form');
    setSelectedEquipment([]);
    setFilterResetKey(prev => prev + 1);
    setDescription('');
    setImages([]);
    setVideos([]);
  } catch {
    setValidationErrors(['Failed to save complaint.']);
    setShowValidationPopup(true);
  } finally {
    setLoading(false);
  }
};
  
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
        console.log('Fetched buildings:', data.buildings);
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
          console.log(selectedBuilding) // Pass building ID
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
          console.log(selectedBuilding, selectedUnit);
          setTenantInfo({
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

  useEffect(() => {
  const fetchTenantDetails = async () => {
    const username = localStorage.getItem('tenantName') || sessionStorage.getItem('tenantName');
    if (!username) return;
    setTenantLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/tenant-details/${encodeURIComponent(username)}`
      );
      setTenantDetails(res.data);
    } catch {
      setTenantDetails(null);
    } finally {
      setTenantLoading(false);
    }
  };
  fetchTenantDetails();
}, []);

//   useEffect(() => {
//   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
//     if (!isSubmitted) {
//       e.preventDefault();
//       e.returnValue = '';
//     }
//   };
//   window.addEventListener('beforeunload', handleBeforeUnload);
//   return () => window.removeEventListener('beforeunload', handleBeforeUnload);
// }, [isSubmitted]);

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
  
//   const handleReportSubmit = async (complaintData: ComplaintReportData & { referenceNumber: string }) => {
//   setLoading(true);
//   try {
//     await axios.post(`${import.meta.env.VITE_API_URL}/api/complaints`, complaintData);
//     //setValidationErrors(['Complaint submitted successfully!']);
//     //setShowValidationPopup(true);
//     setCurrentView('form');
//     setReportData(null);
//     setSelectedEquipment([]);
//     setFilterResetKey(prev => prev + 1);
//     setDescription('');
//     setImages([]);      // <-- reset images
//     setVideos([]); 
//   } catch {
//     setValidationErrors(['Failed to save complaint.']);
//     setShowValidationPopup(true);
//   } finally {
//     setLoading(false);
//   }
// };
  
 const handleReportSubmit = async (complaintData: ComplaintReportData & { referenceNumber: string }) => {
  setLoading(true);
  try {
    // Build FormData for file upload
    const formData = new FormData();
    Object.entries(complaintData).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach(img => {
          if (img instanceof File) formData.append('images', img);
        });
      } else if (key === 'videos' && Array.isArray(value)) {
        value.forEach(vid => {
          if (vid instanceof File) formData.append('videos', vid);
        });
      } else if (key === 'equipment') {
        formData.append('equipment', JSON.stringify(value));
      } else if (typeof value === 'string') {
        formData.append(key, value);
      }
    });

    // Add any fields not covered above (dates, etc.)
    // if (complaintData.startDate) formData.append('startDate', complaintData.startDate);
    // if (complaintData.endDate) formData.append('endDate', complaintData.endDate);
    // if (complaintData.submissionDate) formData.append('submissionDate', complaintData.submissionDate);

    // Debug: log files before submit
    console.log('Images before submit:', complaintData.images);
    console.log('Videos before submit:', complaintData.videos);

    await axios.post(`${import.meta.env.VITE_API_URL}/api/complaints`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    setCurrentView('form');
    setReportData(null);
    setSelectedEquipment([]);
    setFilterResetKey(prev => prev + 1);
    setDescription('');
    setImages([]);
    setVideos([]);
  } catch {
    setValidationErrors(['Failed to save complaint.']);
    setShowValidationPopup(true);
  } finally {
    setLoading(false);
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

  const isPreviewDisabled =
 
  selectedEquipment.length === 0 ||
  selectedEquipment.some(
    item => !item.roomType || !item.category || !item.itemname
  );


  useEffect(() => {
  window.scrollTo(0, 0);
  }, [currentView]);

 const tenantContracts: TenantContract[] = JSON.parse(sessionStorage.getItem('tenantContracts') || '[]');

const uniqueBuildings = Array.from(
  new Map(tenantContracts.map((c: TenantContract) => [c.build_id, c])).values()
);

const unitsForSelectedBuilding = tenantContracts.filter(
  (c: TenantContract) => c.build_id === selectedBuilding
);

const getLatestContract = (contracts: TenantContract[]) => {
  if (!contracts.length) return null;
  return contracts
    .slice()
    .sort((a, b) => new Date(b.contract_sdate || '').getTime() - new Date(a.contract_sdate || '').getTime())[0];
};

const latestContract = getLatestContract(tenantContracts);

// const selectedContract = tenantContracts.find(
//   c => c.build_id === selectedBuilding && c.unit_desc === selectedUnit
// );

const selectedContract = selectedBuilding && selectedUnit
  ? tenantContracts.find(
      c => c.build_id === selectedBuilding && c.unit_desc === selectedUnit
    )
  : latestContract;

// Reusable signature component


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
          Complaint Form
        </h1>
        {/* <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {checklistType === 'moveIn' 
            ? 'Property inspection and tenant move-in documentation' 
            : 'Property inspection and tenant move-out documentation'
          }
        </p> */}
      </div>
     
      {/* Row 2: Tenant Information */}
      {/* Building and Unit Dropdowns */}
<div className="flex flex-col sm:flex-row gap-4 mb-4">
  {/* Building Dropdown */}
  <div className="flex-1">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Building 
    </label>
    <select
  className="w-full border rounded-lg p-2"
  value={selectedBuilding}
  onChange={e => {
    setSelectedBuilding(e.target.value);
    setSelectedUnit('');
  }}
>
  <option value="">Select Building</option>
  {uniqueBuildings.map(b => (
    <option key={b.build_id} value={b.build_id}>
      {b.build_desc}
    </option>
  ))}
</select>
  </div>
  {/* Unit Dropdown */}
  <div className="flex-1">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      Unit 
    </label>
   <select
  className="w-full border rounded-lg p-2"
  value={selectedUnit}
  onChange={e => setSelectedUnit(e.target.value)}
  disabled={!selectedBuilding}
>
  <option value="">Select Unit</option>
  {unitsForSelectedBuilding.map(u => (
    <option key={u.unit_desc} value={u.unit_desc}>
      {u.unit_desc}
    </option>
  ))}
</select>
  </div>
</div>
     <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800 mb-4">
  {tenantLoading ? (
    <div className="text-center text-gray-500 dark:text-gray-400">
      Loading tenant details...
    </div>
  ) : selectedContract ? (
    
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tenant:</label>
         <span className="text-gray-800 dark:text-gray-200">
    {sessionStorage.getItem('tenantName') || 'N/A'}
  </span>
      </div>
      
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Building:</label>
        <span className="text-gray-800 dark:text-gray-200">{selectedContract.build_desc || 'N/A'}</span>
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Unit:</label>
        <span className="text-gray-800 dark:text-gray-200">{selectedContract.unit_desc || 'N/A'}</span>
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contract:</label>
        <span className="text-gray-800 dark:text-gray-200">{selectedContract.contract_id || 'N/A'}</span>
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date:</label>
        <span className="text-gray-800 dark:text-gray-200">
          {selectedContract.contract_sdate ? formatDateShort(selectedContract.contract_sdate) : 'N/A'}
        </span>
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date:</label>
        <span className="text-gray-800 dark:text-gray-200">
          {selectedContract.contract_edate ? formatDateShort(selectedContract.contract_edate) : 'N/A'}
        </span>
      </div>
    </div>
  ) : (
    <div className="text-center text-gray-500 dark:text-gray-400">
      No tenant details found.
    </div>
  )}
</div>
      {/* Row 3: Checklist Type */}
      <div className="flex flex-col">
        <label className="font-semibold mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Raise Complaint Here</label>
      
      </div>
      {/* Row 4: Equipment Section */}
      <FormFilter 
        selectedBuilding={selectedBuilding}
        selectedUnit={selectedUnit}
        selectedItems={selectedEquipment}
        // onEquipmentChange={setSelectedEquipment}
        unitMasterDesc={tenantDetails?.unit_master_desc || ""}
        filterResetKey={filterResetKey}
      />
      <div className="mt-4">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Description
  </label>
  <textarea
    value={description}
    onChange={e => setDescription(e.target.value)}
    rows={3}
    placeholder="Type your complaint description here..."
    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
  />
</div>
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
        {/* <button
        type="button"
        onClick={handleSubmit}
        className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg border border-green-700 transition-colors sm:min-w-[120px]"
        disabled={tenantLoading}
        >
        Submit
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        </button> */}
        <button
  type="button"
  onClick={() => {
    // Prepare the complaint data for preview
    const complaintData = {
  building: selectedContract?.build_desc || '',
  unit: selectedContract?.unit_desc || '',
  tenant: sessionStorage.getItem('tenantName') || '',
  contractNo: selectedContract?.contract_id || '',
  startDate: selectedContract?.contract_sdate || '',
  endDate: selectedContract?.contract_edate || '',
  submissionDate: new Date().toISOString(),
  description,
  images,
  videos,
  username: username ?? '',
  status: "pending",
  equipment: selectedEquipment.map(item => ({
    roomType: item.roomType,
    category: item.category,
    equipment: item.itemname,
    remarks: item.remarks,
  })),
  both: '', // If you have this in contract, use selectedContract.both, else leave as ''
  build_id: selectedContract?.build_id || '',
  unit_desc: selectedContract?.unit_desc || '',
  referenceNumber: '', 
};
    setReportData(complaintData);
    setCurrentView('report');
  }}
  className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg border border-green-700 transition-colors sm:min-w-[120px]"
  disabled={tenantLoading || isPreviewDisabled}
>
  Preview

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
          //message="Please complete the following before proceeding:"
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
  } 
  if (currentView === 'report' && reportData) {
  return (
    <ComplaintReportView
      data={reportData}
      onNewChecklist={() => {
        setCurrentView('form');
        setReportData(null);
      }}
      onSubmit={handleReportSubmit}
      onBack={() => setCurrentView('form')}
      view = "Enabled"
    />
  );
}

return null;
};  