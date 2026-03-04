import React, { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import JsBarcode from 'jsbarcode';
import EquipmentSection, { SelectedItem } from '../components/moveinoutcomponents/EquipmentSection';
import * as ContractAPI from '@/services/Transaction/Contract/Contractapi';
import { canUserAdd } from '@/utils/moduleAccess';
import { formatDateShort } from '@/utils/DateFormat';
import ImageModal from '../components/moveinoutcomponents/ImageModal';
import VideoModal from '../components/moveinoutcomponents/VideoModal';
import DateTimeModal from '@/components/DateTimeModal';
import ValidationPopup from '@/components/ValidationPopup';
import MaintenanceForm from '../components/complaintcomponents/MaintenanceForm';
import BranchForm from '../components/complaintcomponents/BranchForm';
import { useLocation } from 'react-router-dom';
import '@/styles/Moveinout.css'
import axios from 'axios';
import Select from 'react-select';
import { insertComplaint, getAssignedComplaints, editComplaint, insertAssignedComplaints, deleteComplaint, getCatTechnicians } from '@/services/Transaction/Contract/Contractapi';
import { useNavigate } from 'react-router-dom';
import { getTechnicians } from '@/services/Transaction/Contract/Contractapi';
import TechWorkHistory from "@/components/complaintcomponents/TechWorkHistory";
import AvailableSlots from '@/components/complaintcomponents/AvailableSlots';
import Loading from '@/components/complaintcomponents/Loading';
import SignatureForm from '@/components/complaintcomponents/SignatureForm';
import { AdminActionButton, ApproveButton, BranchActionButton, CancelButton } from "@/components/complaintcomponents/Buttons";
import { UpdateEstimationAuth, GetAuthTransitions } from '../services/Transaction/Estimation/Authorizationapi';
import { getRoleGroup } from "../utils/getRoleGroup";

interface Building {
    build_id: string;
    build_desc: string;
    area_desc: string;
    place_desc: string;
    area_id: string;
    place_id: string;
}
interface Unit {
    unit_desc: string;
}
interface Technician {
    tech_id: string;
    uname: string;
}

// Add a type for the modal props
interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    technicians: Technician[];
    scheduleDate: string;
}
interface TenantInfo {
    tenantName: string;
    contractNo: string;
    startDate: string;
    endDate: string;
    unitType: string;
    tenantCode: string;
    placeDesc: string;
    unitNature: string;
}
interface ComplaintImage {
    url: string;
    [key: string]: any;
}
interface CategoryItem {
    category: string;
    remarks: string;
}
interface ComplaintReportData {
    building: string;
    unit_desc: string;
    submissionDate: string;
    username: string;
    status: string;
    categories: CategoryItem[];
    type: 'indoor' | 'outdoor';
    block: string;
    floor: string;
    place: string;
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

type AccessConfig = {
    [field: string]: { disabled?: boolean; hidden?: boolean };
};

type ComplaintDetail = {
  assigned_to?: string;
  assigned_date?: string;
  build_desc?: string;
  building?: string;
  build_id?: string;
  category?: string;
  status?: string;
  // add other fields as needed
};

type ItemRow = {
  categoryValue: string;
  categoryLabel: string;
  itemValue: string;
  itemLabel: string;
  status: string;
  quantity: number;
  remarks: string;
  brdcode?: string;
  subcode?: string;
  unit?: string;
};

type ItemOption = {
  value: string;
  label: string;
  brdcode?: string;
  subcode?: string;
  micunit?: string;
};



export default function ComplaintForm() {
    // All field states
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [selectedBuilding, setSelectedBuilding] = useState('');
    const [buildingsearchTerm, setbuildingSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnit, setSelectedUnit] = useState('');
    const [unitSearchTerm, setUnitSearchTerm] = useState('');
    const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
    const [type, setType] = useState<'indoor' | 'outdoor'>('indoor');
    const [block, setBlock] = useState('');
    const [place, setPlace] = useState('');
    const [floor, setFloor] = useState('');
    const [categories, setCategories] = useState<CategoryItem[]>([{ category: '', remarks: '' }]);
    const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
    const [tenantLoading, setTenantLoading] = useState(false);
    const [categoryTechnicians, setCategoryTechnicians] = useState<{
  [category: string]: Technician[];
}>({});
    const [technicianSearch, setTechnicianSearch] = useState('');
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [scheduleDate, setScheduleDate] = useState('');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [barcodeValue, setBarcodeValue] = useState<string>('');
    const [barcodeBase64, setBarcodeBase64] = useState<string>('');
    //const [categoryOptions, setCategoryOptions] = useState<{ comp_cat_code: string; comp_cat_desc: string }[]>([]);
    const [checklistType, setChecklistType] = useState('moveIn');
    const [selectedEquipment, setSelectedEquipment] = useState<SelectedItem[]>([]);
    const [showDateTimeModal, setShowDateTimeModal] = useState(false);
    const [currentView, setCurrentView] = useState<'form' | 'tenantSignature' | 'signature'>('form');
    const [tenantSignature, setTenantSignature] = useState('');
    const tenantSigRef = useRef<SignatureCanvas>(null);
    const technicianSigRef = useRef<SignatureCanvas>(null);

    const [images, setImages] = useState<File[]>([]);
    const [videos, setVideos] = useState<File[]>([]);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [reportData, setReportData] = useState<ComplaintReportData | null>(null);

    const [showValidationPopup, setShowValidationPopup] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [description, setDescription] = useState('');

    const canAdd = canUserAdd('Move &In Register');
    const username = sessionStorage.getItem('username')
    const [tenantDetails, setTenantDetails] = useState<any>(null);
    const [filterResetKey, setFilterResetKey] = useState(0);
    const [showTechWorkHistory, setShowTechWorkHistory] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [newRemarks, setNewRemarks] = useState('');
    const [complaintData, setComplaintData] = useState<any>(null);
    const [assignedInfo, setAssignedInfo] = useState<{ technician: string; date: string } | null>(null);
    const [Transitions, setTransitions] = useState<{ nextStatus: string; action: string } | null>(null);


    // Role and access config
    const [userRole, setUserRole] = useState<string | null>(null);
    const [accessConfig, setAccessConfig] = useState<AccessConfig>({});
    const [showAdminPanel, setShowAdminPanel] = useState(false);

    const location = useLocation();
    const complaint = location.state?.complaint;
    //console.log("Complaint passed via location state:", complaint);
    const fromDetailedView = location.state?.fromDetailedView === true;
    const navigate = useNavigate();
    const viewType = location.state?.viewType || (fromDetailedView ? 'detailed' : 'branch');
    const complaintType = location.state?.complaintType || complaint?.type || 'indoor';
    const isAssignMode = fromDetailedView && viewType === 'assign';
    const [assignLoading, setAssignLoading] = useState(false);
    const [assigned, setAssigned] = useState(false);
    const isAssigned = assigned || complaint?.status === 'ASSIGNED';
    const [workHistoryData, setWorkHistoryData] = useState<ComplaintDetail[]>([]);
    //const [showAvailableSlots, setShowAvailableSlots] = useState(false);
    const [buildingsLoading, setBuildingsLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    const isVisited = complaint?.status?.toUpperCase() === "VISITED";
    const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string; sscode: string; sdescr: string }[]>([]);
    const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
    const [selectedItem, setSelectedItem] = useState("");
    const [itemRows, setItemRows] = useState<ItemRow[]>([]);
    const returnTo = location.state?.returnTo;
    const [categoryAssignments, setCategoryAssignments] = useState<{
      [category: string]: {
        technician: string;
        date: string;
      };
    }>({});
    
    const [showAvailableSlots, setShowAvailableSlots] = useState(false);
    const [availableSlotCategory, setAvailableSlotCategory] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);




    //console.log("Complaint passed via location state:", complaint);

  useEffect(() => {
    //console.log("complaint object on mount/useEffect:", complaint);
    if (complaint) {
        // Find building by description
        const matchedBuilding = buildings.find(
            b => b.build_desc === complaint.building
        );
        if (matchedBuilding) {
            setSelectedBuilding(matchedBuilding.build_id);
        } else {
            setSelectedBuilding('');
        }

        // Use the unit value from the complaint details API directly
        const unitValue = complaint.unit || complaint.unit_desc || '';
        if (unitValue) {
            setUnits([{ unit_desc: unitValue }]);
            setSelectedUnit(unitValue);
        } else {
            setUnits([]);
            setSelectedUnit('');
        }

        setBlock(complaint.block || '');
        setPlace(complaint.accessArea || complaint.place || '');
        setDescription(complaint.description || '');
        setType(complaint.type || 'indoor');
        setFloor(complaint.floor || complaint.floor_no || '');

        // Set categories if available
        if (complaint.categories && Array.isArray(complaint.categories)) {
            setCategories(complaint.categories.map((cat: any) => ({
                category: cat.category || '',
                remarks: cat.remarks || ''
            })));
        } else if (complaint.complaintDetails && Array.isArray(complaint.complaintDetails)) {
            setCategories(complaint.complaintDetails.map((cat: any) => ({
                category: cat.category || '',
                remarks: cat.remarks || ''
            })));
        }

        if (complaint.assignedTo) {
      setSelectedTechnician(complaint.assignedTo);
    }
    if (complaint.scheduledTime) {
      setScheduleDate(complaint.scheduledTime);
    }
    }
}, [complaint, buildings]);

// useEffect(() => {
//   if (selectedBuilding) {
//     getTechnicians(selectedBuilding).then(res => {
//       let techs = res.technicians || [];
//       // If assigned_to is not in the list, add it
//       //console.log("complaints", complaint);
//       if (
//         complaint?.assignedTo &&
//         !techs.some((t: Technician) => t.uname === complaint.assignedTo)
//       ) {
//         techs = [{ uname: complaint.assignedTo, tech_id: '' }, ...techs];
//       }
//       //console.log("Fetched technicians for building", selectedBuilding, ":", techs);
//       setTechnicians(techs);
//     });
//   } else {
//     setTechnicians([]);
//   }
//   // eslint-disable-next-line
// }, [selectedBuilding, complaint?.assignedTo]);

 useEffect(() => {
    async function fetchCategories() {
      const res = await ContractAPI.getComplaintCategories();
      if (res.success && Array.isArray(res.categories)) {
        setCategoryOptions(
          res.categories.map((cat: any) => ({
            value: cat.sscode,
            label: cat.sdescr,
            sscode: cat.sscode,
            sdescr: cat.sdescr
          }))
        );
      }
    }
    fetchCategories();
  }, []);

useEffect(() => {
  if (selectedBuilding && selectedUnit) {
    ContractAPI.getTenantInfo(selectedBuilding, selectedUnit)
      .then(res => {
        if (res.success) {
          setTenantInfo(res);   // ✅ use full response
          //console.log("Tenant data:", res);  // ✅ correct logging
        } else {
          setTenantInfo(null);
        }
      });
  } else {
    setTenantInfo(null);
  }
}, [selectedBuilding, selectedUnit]);

  // Fetch items when category changes
  useEffect(() => {
    async function fetchItems() {
      if (!selectedCategory) {
        setItemOptions([]);
        return;
      }
      const res = await ContractAPI.getCategoryItems(selectedCategory);
      if (res.success && Array.isArray(res.items)) {
       setItemOptions(
          res.items.map((item: any) => ({
            value: item.itemno,
            label: item.itemname,
            brdcode: item.brdcode,
            subcode: item.subcode,
            micunit: item.micunit,
          }))
        );
      } else {
        setItemOptions([]);
      }
    }
    fetchItems();
    setSelectedItem(""); // Reset item selection when category changes
  }, [selectedCategory]);

  // Add item row
  const handleAddItem = () => {
    if (!selectedCategory || !selectedItem) return;
    const itemObj = itemOptions.find((i: ItemOption) => i.value === selectedItem);
setItemRows([
  ...itemRows,
  {
    categoryValue: selectedCategory,
    categoryLabel: categoryOptions.find(c => c.value === selectedCategory)?.label || '',
    itemValue: selectedItem,
    itemLabel: itemObj?.label || selectedItem,
    status: '',
    quantity: 1,
    remarks: '',
    brdcode: itemObj?.brdcode || '',
    subcode: itemObj?.subcode || '',
    unit: itemObj?.micunit || '', // micunit as unit
  },
]);
    if (!itemObj) return;
    // Prevent duplicate items
    if (itemRows.some((row) => row.itemValue === selectedItem && row.categoryValue === selectedCategory)) return;
    setItemRows([
      ...itemRows,
      {
        categoryValue: selectedCategory,
        categoryLabel: categoryOptions.find((c) => c.value === selectedCategory)?.label || "",
        itemValue: selectedItem,
        itemLabel: itemObj.label,
        status: "",
        quantity: 1,
        remarks: "",
        brdcode: itemObj?.brdcode || "",
        subcode: itemObj?.subcode || "",
        unit: itemObj?.micunit || "",
      },
    ]);
    setSelectedItem("");
  };

  // Remove item row
  const handleRemoveItem = (idx: number) => {
    setItemRows((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update item row fields
  const handleItemRowChange = (idx: number, field: string, value: any) => {
    setItemRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

    useEffect(() => {
        const rawRole = (sessionStorage.getItem('role') || localStorage.getItem('role') || '').toLowerCase();
        const role = getRoleGroup(rawRole) ?? null;
        console.log("User role from storage:", rawRole, "Normalized role group:", role);
        setUserRole(role);

        // Get access config from the role-based provider
        if (role === 'system administrator' && typeof MaintenanceForm.getAccessConfig === 'function') {
            setAccessConfig(MaintenanceForm.getAccessConfig());
        } else if (role === 'branch' && typeof BranchForm.getAccessConfig === 'function') {
            setAccessConfig(BranchForm.getAccessConfig());
        } else {
            setAccessConfig({});
        }
    }, []);

    useEffect(() => {
        // Fetch buildings from API on mount
        const fetchBuildings = async () => {
            setBuildingsLoading(true);
            const result = await ContractAPI.getBuildings();
            if (result.success && result.buildings) {
                setBuildings(result.buildings);
            }
            setBuildingsLoading(false);
        };
        fetchBuildings();
    }, []);

    // Helper to check access
    const getFieldAccess = (field: string) => accessConfig[field] || { disabled: false, hidden: false };

   

    // Category handlers
    const handleCategoryChange = (idx: number, field: keyof CategoryItem, value: string) => {
        setCategories(prev =>
            prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
        );
    };
    const handleAddCategory = () => {
        setCategories(prev => [...prev, { category: '', remarks: '' }]);
    };
    const handleRemoveCategory = (idx: number) => {
        setCategories(prev => prev.filter((_, i) => i !== idx));
    };

const fetchTechWorkHistory = async () => {
  const res = await ContractAPI.getComplaintDetails(undefined, selectedBuilding);
  //console.log("Fetched complaint details for work history:", res);
  setWorkHistoryData(res.complaintDetails || []);
};

useEffect(() => {
  if (showTechWorkHistory) {
    fetchTechWorkHistory();
  }
}, [showTechWorkHistory, selectedBuilding, selectedTechnician]);




    const getComplaintNum = () => {
        const now = new Date();
        const dateStr = now
            .toLocaleDateString('en-GB')
            .split('/')
            .reverse()
            .join(''); // YYYYMMDD
        const timeStr = now
            .toTimeString()
            .split(' ')[0]
            .replace(/:/g, ''); // HHmmss
        return `${selectedBuilding}-${dateStr}-${timeStr}`;
    };

const handleNext = () => {
  // Always generate a complaintNum for the signature step
  //const complaintNum = getComplaintNum();
  //console.log("complaints in handleNext:", complaint);
  setComplaintData({
    complaint_id: complaint?.id|| '', // Use existing complaint_id if editing, else empty for new
    complaintNum: complaint?.refNum || '', // required, not null
    Date: new Date().toISOString(),
    build_id: selectedBuilding,
    build_desc: buildings.find(b => b.build_id === selectedBuilding)?.build_desc || '',
    unit_desc: selectedUnit,
    block,
    place,
    floor,
    categories,
    description,
    images,
    videos,
    itemRows,
    status: 'VISITED',
    auditrev: 1,
    userid: username ?? '',
    both: tenantInfo?.tenantCode || '',
    CTenantName: tenantInfo?.tenantName || '',
    contract_id: tenantInfo?.contractNo || '',
    type,
    complaintType: complaint?.complaintType || '',
    contract_sdate: tenantInfo?.startDate || '',
    contract_edate: tenantInfo?.endDate || '',
    place_desc: tenantInfo?.placeDesc || '',
    unitNature: tenantInfo?.unitNature || '',
    unit_master_desc: tenantInfo?.unitType || ''
    // Add any other fields you need for the backend here
  });
  
  setCurrentView('tenantSignature');
};

  const handleSubmit = async () => {
    if (userRole === 'branch') {
        if (complaint?.id) {
            // UPDATE: Use editComplaint
            const payload = {
                complaint_id: complaint.id,
                description,
                block,
                place,
                floor,
                username: username ?? '',
            };
            //console.log("Updating complaint with payload:", payload);
            const result = await editComplaint(payload);
           // console.log("Edit complaint result:", result);
            if (result.success) {
                setShowSuccessPopup(true);
                resetForm();
            } else {
                setValidationErrors([result.error]);
                setShowValidationPopup(true);
            }
        } else {
            // SUBMIT (NEW): Use insertComplaint
            const payload = {
                complaintNum: getComplaintNum(),
                complaintType: 'BRANCH',
                build_id: selectedBuilding,
                build_desc: buildings.find(b => b.build_id === selectedBuilding)?.build_desc || '',
                unit_desc: selectedUnit,
                block,
                accessArea: place,
                floor,
                both: tenantInfo?.tenantCode || '',
                CTenantName: tenantInfo?.tenantName || '',
                contract_id: tenantInfo?.contractNo || '',
                contract_sdate: tenantInfo?.startDate || '',
                contract_edate: tenantInfo?.endDate || '',
                type,
                description,
                status: 'PENDING',
                auditrev: 1,
                userid: username ?? '',
                Date: formatDateShort(new Date()),
                assigned: 0,
                preparedBy: username ?? '',
                authLevel: 1,
                authStatus: 'AWAITING FOR APPROVAL'
            };
            //console.log("Submitting complaint with payload:", payload);
            const result = await insertComplaint({
                ...payload,
                images, // array of File
                videos, // array of File
            });
            //console.log("Insert complaint result:", result);
            if (result.success) {
                setShowSuccessPopup(true);
                resetForm();
            } else {
                setValidationErrors([result.error]);
                setShowValidationPopup(true);
            }
        }
    } else if (userRole === 'system administrator') {
        // Use values from the selected complaint if present
        const complaintId = complaint?.id || '';
        const complaintNum = complaint?.refNum || getComplaintNum();
        const complaintDate = complaint?.submissionDate || formatDateShort(new Date());

        // Save a separate record for each category
        let allSuccess = true;
        let errorMsg = '';
        for (const [idx, cat] of categories.entries()) {
            const payload = {
                complaint_id: complaintId,
                complaintNum,
                Date: complaintDate,
                build_id: selectedBuilding,
                build_desc: buildings.find(b => b.build_id === selectedBuilding)?.build_desc || '',
                unit_desc: selectedUnit,
                both: '', // set as needed
                CTenantname: '', // set as needed
                contract_id: '', // set as needed
                status: 'PENDING',
                assigned_to: '', // set as needed
                assigned_by: '', // set as needed
                assigned_date: '', // set as needed
                subComp_id: idx + 1, // auto-increment for each category
                category: cat.category,
                remarks: cat.remarks,
                auditrev: 1,
                userid: username ?? '',
                sysdate: '', // let DB default handle this, or set as needed
                // No complaintType, images, or videos
            };

            // Uncomment and implement this if needed:
            // const result = await insertComplaintDetails(payload);
            // if (!result.success) {
            //     allSuccess = false;
            //     errorMsg = result.error || 'Unknown error';
            //     break;
            // }
        }

        if (allSuccess) {
            setShowSuccessPopup(true);
            resetForm();
        } else {
            setValidationErrors([errorMsg]);
            setShowValidationPopup(true);
        }
    }
};

const handleApprove = async () => {
  if (!complaint?.id) {
    setValidationErrors(['No complaint selected for approval.']);
    setShowValidationPopup(true);
    return;
  }
  //console.log("Approving complaint with ID:", complaint);
  try {
    const payload = {
      complaint_id: complaint.id,
      description: complaint.description || '',
      block: complaint.block || '',
      place: complaint.place || '',
      floor: complaint.floor || '',
      build_desc: complaint.building || '',
      unit_desc: complaint.unit || '',
      status: 'APPROVED', // Set the status to APPROVED
      username: username ?? '',
      approvedBy: username ?? '',
      authLevel: 2,
      authStatus: 'APPROVED',
    };
    const result = await editComplaint(payload);
    if (result.success) {
      setAssignSuccessMsg("Complaint approved successfully!");
      setShowSuccessPopup(true);
      resetForm();
    } else {
      setValidationErrors([result.error || 'Failed to approve complaint.']);
      setShowValidationPopup(true);
    }
  } catch (error) {
    setValidationErrors(['An error occurred while approving the complaint.']);
    setShowValidationPopup(true);
  }
};



  
 const updateComplaintDetails = async () => {
      if (!complaint?.id || !selectedTechnician || !scheduleDate) {
        setValidationErrors(['Please select technician, schedule date, and ensure complaint is loaded.']);
        setShowValidationPopup(true);
        return;
      }
      setAssignLoading(true);
      const result = await ContractAPI.updateComplaintDetails({
        complaint_id: complaint.id,
        subComp_id: complaint.subComp_id,
        status: 'ASSIGNED',
        assigned_to: selectedTechnician,
        assigned_by: typeof username === 'string' ? username : '',
        assigned_date: scheduleDate,
        auditrev: (complaint.auditrev || 1) + 1
      });
      setAssignLoading(false);
      if (result.success) {
        setAssignSuccessMsg(
          complaint?.assignedTo
            ? "Complaint reassigned successfully!"
            : "Complaint assigned successfully!"
        );
        setShowSuccessPopup(true);
        setValidationErrors([]);
        setShowValidationPopup(false);
      } else {
        setValidationErrors([result.error || 'Failed to assign complaint.']);
        setShowValidationPopup(true);
      }
    };

const handleAssign = async () => {
  // Validate all categories
  if (!complaint?.complaint_id) {
    setValidationErrors(['Complaint is not loaded.']);
    setShowValidationPopup(true);
    return;
  }

  for (const item of complaint.items || []) {
    const categoryKey = item.category;
    const technician = categoryAssignments[categoryKey]?.technician;
    const date = categoryAssignments[categoryKey]?.date;

    if (!technician || !date) {
      setValidationErrors([`Please select technician and schedule date for category "${categoryKey}".`]);
      setShowValidationPopup(true);
      return;
    }
  }

  setAssignLoading(true);

  // Assign for each category
  let allSuccess = true;
  let errorMsg = '';
  for (const item of complaint.items || []) {
    const categoryKey = item.category;
    const technician = categoryAssignments[categoryKey]?.technician;
    const date = categoryAssignments[categoryKey]?.date;

    const assignment = {
      complaint_id: complaint.complaint_id,
      complaintNum: complaint.Reference || complaint.complaintNum || "",
      Date: complaint.submissionDate || new Date().toISOString(),
      build_id: complaint.build_id || "",
      build_desc: complaint.building || complaint.build_desc || "",
      unit_desc: complaint.unit || complaint.unit_desc || "",
      status: "ASSIGNED",
      assigned_to: technician,
      assigned_by: typeof username === "string" ? username : "",
      assigned_date: date,
      category: categoryKey,
      userid: typeof username === "string" ? username : ""
    };

    const result = await insertAssignedComplaints(assignment);
    if (!result.success) {
      allSuccess = false;
      errorMsg = result.error || "Failed to assign complaint.";
      break;
    }
  }

  setAssignLoading(false);

  if (allSuccess) {
    setAssignSuccessMsg("Complaint assigned successfully!");
    setShowSuccessPopup(true);
    setValidationErrors([]);
    setShowValidationPopup(false);
  } else {
    setValidationErrors([errorMsg]);
    setShowValidationPopup(true);
  }
};
    const resetForm = () => {
        setSelectedBuilding('');
        setSelectedUnit('');
        setBlock('');
        setPlace('');
        setFloor('');
        setCategories([{ category: '', remarks: '' }]);
        setDescription('');
        setImages([]);
        setVideos([]);
        // Add any other fields you want to reset
    };

        // if (buildingsLoading || categoriesLoading) return <Loading />;
useEffect(() => {
  async function fetchAssigned() {
   // console.log("useeffect triggered for complaintNum:", complaint);
    //console.log("Fetching assigned complaints for complaintNum:", complaint?.Reference, "and category:", complaint?.items?.[0]?.category );
    if (complaint?.Reference && (complaint?.items?.[0]?.category || selectedCategory)) {
      const res = await getAssignedComplaints(username || '');
      //console.log("Fetched assigned complaints:", res);
     if (res.success && Array.isArray(res.complaints)) {
  const found = res.complaints.find(
    (c: any) =>
      c.complaintNum === complaint.Reference &&
      c.category === (complaint.items?.[0]?.category || '')
  );
  if (found) {
    setAssignedInfo({
      technician: found.assigned_to,
      date: found.assigned_date,
    });
    //console.log("Found assigned complaint:", found);
  } else {
    setAssignedInfo(null);
    console.log("No assigned complaint found");
  }
}
    }
  }
  fetchAssigned();
}, [complaint?.Reference, complaint?.items?.[0]?.category, username]);

useEffect(() => {
  if (assignedInfo) {
    if (!selectedTechnician && assignedInfo.technician) setSelectedTechnician(assignedInfo.technician);
    if (!scheduleDate && assignedInfo.date) setScheduleDate(assignedInfo.date);
  }
  // eslint-disable-next-line
}, [assignedInfo]);

const handleCancel = async () => {
  if (complaint?.id) {
    const result = await deleteComplaint(complaint.id);
    if (result.success) {
      // Optionally show a success popup or navigate away
      setShowSuccessPopup(true);
      setAssignSuccessMsg("Complaint cancelled and deleted successfully!");
      // You can also navigate away if needed:
      navigate('/&Tenant Master Maintenance');
    } else {
      setValidationErrors([result.error || "Failed to cancel complaint."]);
      setShowValidationPopup(true);
    }
  }
};


const fetchTechniciansForCategory = async (category: string) => {
  if (!category) return;
  const res = await getCatTechnicians(category);
  if (res?.technicians) {
    setCategoryTechnicians(prev => ({
      ...prev,
      [category]: res.technicians
    }));
  } else {
    setCategoryTechnicians(prev => ({
      ...prev,
      [category]: []
    }));
  }
};

useEffect(() => {
  if (complaint?.items) {
    complaint.items.forEach((item: any) => {
      fetchTechniciansForCategory(item.category);
    });
  }
}, [complaint?.items]);

//console.log("selectedTechnician:", selectedTechnician, "scheduleDate:", scheduleDate, "assignedInfo:", assignedInfo); 
    useEffect(() => {
      const fetchTransitions = async () => {
        setLoading(true);
        const result = await GetAuthTransitions('Complaint');
        if (result.success) {
          setTransitions(result.transitions);
        }
        setLoading(false);
      };
      fetchTransitions();
    }, []);   

    const role = sessionStorage.getItem('role') || localStorage.getItem('role') || '';
    
    const allowedSubmit = Transitions &&
  Array.isArray(Transitions) &&
  Transitions.filter(
    t =>
      t.action?.toLowerCase() === "submit" &&
      (
        !t.allowedRoles ||
        t.allowedRoles.trim() === "" ||
        t.allowedRoles.toLowerCase() === (role || "").toLowerCase()
      )
  );



  const allowedApprove = Transitions &&
  Array.isArray(Transitions) &&
  Transitions.filter(
    t =>
      t.action?.toLowerCase() === "approve" &&
      (
        !t.allowedRoles ||
        t.allowedRoles.trim() === "" ||
        t.allowedRoles.toLowerCase() === (role || "").toLowerCase()
      )
  );

const allowedCancel = Transitions &&
  Array.isArray(Transitions) &&
  Transitions.filter(
    t =>
      t.action?.toLowerCase() === "cancel" &&
      (
        !t.allowedRoles ||
        t.allowedRoles.trim() === "" ||
        t.allowedRoles.toLowerCase() === (role || "").toLowerCase()
      )
  );

    if (currentView === 'tenantSignature' ) {
  return (
    <SignatureForm
      complaint={complaintData}
     // onNewChecklist={}
        onBack={() => setCurrentView('form')}
      // Pass any other props you need
    />
  );
}

    return (
        <>
            <div className="p-4 max-w-4xl mx-auto space-y-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                <div className="text-center border-b border-gray-300 dark:border-gray-600 pb-4">
                    <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        Complaint Form
                    </h1>
                </div>
                {/* Row 1: Building and Indoor/Outdoor Toggle */}
                <div className="flex gap-4 mb-4">
                    {/* Building Dropdown */}
                    {!getFieldAccess('building').hidden && (
  <div className="w-2/3">
    <label className="block text-sm font-semibold  dark:text-gray-300 mb-1">
      Building
    </label>
    <Select
      className="w-full"
      options={buildings.map(b => ({
        value: b.build_id,
        label: b.build_desc
      }))}
      value={
        selectedBuilding
          ? {
              value: selectedBuilding,
              label:
                buildings.find(b => b.build_id === selectedBuilding)?.build_desc ||
                ''
            }
          : null
      }
      onChange={async (option: any) => {
        setSelectedBuilding(option?.value || '');
        setSelectedUnit('');
        // Fetch units for selected building
        if (option?.value) {
          const result = await ContractAPI.getUnits(option.value);
          if (result.success && result.units) {
            setUnits(result.units);
          } else {
            setUnits([]);
          }
        } else {
          setUnits([]);
        }
      }}
      isClearable
      isSearchable
      isDisabled={getFieldAccess('building').disabled}
      placeholder="Select Building"
    />
  </div>
)}

{/* Unit Dropdown */}
{!getFieldAccess('unit').hidden && (
  <div className="w-1/3">
    <label className="block text-sm font-semibold  dark:text-gray-300 mb-1">
      Unit (Optional)
    </label>
    <Select
      className="w-full"
      options={units.map((u: any) => ({
        value: u.unit_desc,
        label: u.unit_desc
      }))}
      value={
        selectedUnit
          ? { value: selectedUnit, label: selectedUnit }
          : null
      }
      onChange={option => setSelectedUnit(option?.value || '')}
      isClearable
      isSearchable
      isDisabled={getFieldAccess('unit').disabled || !selectedBuilding}
      placeholder="Select Unit"
    />
  </div>
)}
                    {/* Indoor/Outdoor Toggle */}
                    {!getFieldAccess('type').hidden && !fromDetailedView && (
                        <div className="w-1/3 flex items-end">
                            <div className="flex rounded-lg overflow-hidden border border-blue-500 w-full">
                                {complaint && complaint.type ? (
                                    <button
                                        type="button"
                                        className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white"
                                        disabled
                                    >
                                        {complaint.type.charAt(0).toUpperCase() + complaint.type.slice(1)}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className={`flex-1 px-4 py-2 text-sm font-medium ${type === 'indoor' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                                            onClick={() => setType('indoor')}
                                            disabled={getFieldAccess('type').disabled}
                                        >
                                            Indoor
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 px-4 py-1 text-sm font-medium ${type === 'outdoor' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                                            onClick={() => setType('outdoor')}
                                            disabled={getFieldAccess('type').disabled}
                                        >
                                            Outdoor
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {/* Row 2: Block and Place (only if indoor) */}
                {type === 'indoor'  && !(fromDetailedView && viewType === 'assign') && (
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        {!getFieldAccess('block').hidden && (
                            <div className="flex-1">
                                <label className="block text-sm font-semibold  dark:text-gray-300 mb-1">
                                    Block
                                </label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg p-2"
                                    value={block}
                                    onChange={e => setBlock(e.target.value)}
                                    placeholder="Enter block"
                                    disabled={getFieldAccess('block').disabled}
                                />
                            </div>
                        )}
                        {!getFieldAccess('floor').hidden && (
                            <div className="flex-1">
                                <label className="block text-sm font-semibold  dark:text-gray-300 mb-1">
                                    Floor No
                                </label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg p-2"
                                    value={floor}
                                    onChange={e => setFloor(e.target.value)}
                                    placeholder="Enter floor no"
                                    disabled={getFieldAccess('floor').disabled}
                                />
                            </div>
                        )}
                        {!getFieldAccess('place').hidden && (
                            <div className="flex-1">
                                <label className="block text-sm font-semibold  dark:text-gray-300 mb-1">
                                    Access Area
                                </label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg p-2"
                                    value={place}
                                    onChange={e => setPlace(e.target.value)}
                                    placeholder="Enter place"
                                    disabled={getFieldAccess('place').disabled}
                                />
                            </div>
                        )}
                    </div>
                )}
                {/* Row 3: Description */}
                {!getFieldAccess('description').hidden &&  !(fromDetailedView && viewType === 'assign') && (
                    <div className="mt-4">
                        <label className="block text-sm font-semibold  dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Type your complaint description here..."
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            disabled={getFieldAccess('description').disabled}
                        />
                    </div>
                )}
                {/* Category & Remarks */}
                {!getFieldAccess('categories').hidden && !(fromDetailedView && viewType === 'assign') && (
<div>
  <label className="block text-sm font-semibold dark:text-gray-300 mb-2">
    Category
  </label>

  {/* --- Item selection UI --- */}
  <div className="mt-6">
    <div className="flex gap-2 mb-2">
      <div className="flex-1">
        <Select
          value={
            selectedCategory
              ? {
                  value: selectedCategory,
                  label:
                    categoryOptions.find(opt => opt.value === selectedCategory)?.label ||
                    selectedCategory
                }
              : null
          }
          onChange={option => {
            setSelectedCategory(option?.value || '');
            setSelectedItem('');
            setItemOptions([]); // Optionally clear items until new fetch
          }}
          options={categoryOptions.map(opt => ({
            value: opt.value,
            label: opt.label
          }))}
          isClearable
          isSearchable
          placeholder="Select Category for Item"
          isDisabled={getFieldAccess('categories').disabled || fromDetailedView}
        />
      </div>
      <div className="flex-1">
        <Select
          value={
            selectedItem
              ? {
                  value: selectedItem,
                  label: itemOptions.find(opt => opt.value === selectedItem)?.label || selectedItem
                }
              : null
          }
         onChange={option => {
  const value = option?.value || '';
  setSelectedItem(value);
  // Add item immediately on select
  if (
    value &&
    selectedCategory &&
    !itemRows.some(
      row => row.itemValue === value && row.categoryValue === selectedCategory
    )
  ) {
    const itemObj = itemOptions.find(i => i.value === value);
    setItemRows([
      ...itemRows,
      {
        categoryValue: selectedCategory, // for backend, send as category
        categoryLabel:
          categoryOptions.find(c => c.value === selectedCategory)?.label || '',
        itemValue: value,
        itemLabel: itemObj?.label || value,
        status: '',
        quantity: 1,
        remarks: '',
        brdcode: itemObj?.brdcode || '',      // <-- add this
        subcode: itemObj?.subcode || '',      // <-- add this
        unit: itemObj?.micunit || '',         // <-- add this (micunit as unit)
      },
    ]);
    setSelectedItem('');
  }
}}
          options={itemOptions}
          isClearable
          isSearchable
          placeholder="Select Item"
          isDisabled={!selectedCategory || getFieldAccess('categories').disabled || fromDetailedView}
        />
      </div>
    </div>
    {/* Item Rows */}
   {itemRows.length > 0 && (
  <div className="space-y-3 mt-2">
    {itemRows.map((item, idx) => (
      <div key={item.categoryValue + '-' + item.itemValue} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Item Name */}
          <div className="font-medium text-gray-700 dark:text-gray-300 lg:flex-1 lg:min-w-0">
            {item.itemLabel}
          </div>
          {/* Qty and Remarks and Remove Button */}
          <div className="flex gap-3 lg:w-2/3 w-full">
            <input
              type="number"
              value={item.quantity === 0 ? '' : item.quantity}
              min={0}
              onChange={e => handleItemRowChange(idx, "quantity", Number(e.target.value))}
              placeholder="QTY..."
              className="w-16 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-0"
            />
            <input
              type="text"
              value={item.remarks}
              onChange={e => handleItemRowChange(idx, "remarks", e.target.value)}
              placeholder="Remarks..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-0"
              style={{ minWidth: 0, width: "100%", maxWidth: 400 }}
            />
            <button
              type="button"
              onClick={() => handleRemoveItem(idx)}
              className="text-red-600 hover:text-red-800 px-2 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 flex-shrink-0 min-w-[32px] flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
)}
  </div>
</div>
)}
            
{!getFieldAccess('technician').hidden &&
  fromDetailedView &&
  viewType === 'assign' &&
  complaint?.items?.map((item: any, idx: number) => {
    const categoryKey = item.category;

    return (
      <div key={categoryKey + idx} className="flex flex-row gap-2 items-end mb-3">
        {/* Category (Read Only) */}
        <div style={{ width: '22%' }}>
          <input
            type="text"
            value={
              categoryOptions.find(opt => opt.value === categoryKey)?.label ||
              categoryKey
            }
            disabled
            className="w-full border rounded-lg p-2 bg-gray-100 text-gray-700"
          />
        </div>
        {/* Technician */}
        <div style={{ width: '22%' }}>
          <Select
  value={
    categoryAssignments[categoryKey]?.technician
      ? {
          value: categoryAssignments[categoryKey].technician,
          label: categoryAssignments[categoryKey].technician
        }
      : null
  }
  onChange={option =>
    setCategoryAssignments(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        technician: option?.value || ''
      }
    }))
  }
  options={
    categoryTechnicians[categoryKey]?.map(t => ({
      value: t.uname,
      label: t.uname
    })) || []
  }
  isClearable
  isSearchable
  isDisabled={getFieldAccess('technician').disabled || isVisited}
  placeholder="Technician..."
  styles={{ menu: base => ({ ...base, zIndex: 9999 }) }}
/>
        </div>
        {/* Date */}
        <div style={{ width: '20%', position: 'relative' }}>
          <button
            type="button"
            className="border rounded p-2 w-full"
            disabled={getFieldAccess('technician').disabled || isVisited}
            onClick={() => setActiveCategory(categoryKey)}
          >
            {categoryAssignments[categoryKey]?.date
              ? new Date(
                  categoryAssignments[categoryKey].date
                ).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })
              : 'Date & time'}
          </button>
        </div>
        {/* Available Slots */}
        <div style={{ width: '28%' }}>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded border border-blue-700 hover:bg-blue-700 transition-colors w-full"
            disabled={
              !categoryAssignments[categoryKey]?.technician || isVisited
            }
           onClick={() => {
  setAvailableSlotCategory(categoryKey);
  setShowAvailableSlots(true);
}}
          >
            See Available Slots
          </button>
        </div>
      </div>
    );
  })}

  {activeCategory && (
  <DateTimeModal
    value={
      categoryAssignments[activeCategory]?.date
        ? new Date(categoryAssignments[activeCategory].date)
        : undefined
    }
    onChange={date => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const localDateString = `${date.getFullYear()}-${pad(
        date.getMonth() + 1
      )}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
        date.getMinutes()
      )}:00`;

      setCategoryAssignments(prev => ({
        ...prev,
        [activeCategory]: {
          ...prev[activeCategory],
          date: localDateString
        }
      }));

      setActiveCategory(null);
    }}
    onCancel={() => setActiveCategory(null)}
  />
)}

{/* AvailableSlots Modal */}
{showAvailableSlots && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.3)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}
    onClick={() => setShowAvailableSlots(false)}
  >
    <div
      style={{
        background: "#fff",
        borderRadius: "10px",
        maxWidth: "1000px",
        width: "100%",
        minWidth: "340px",
        margin: "0 auto",
        maxHeight: "90vh",
        overflow: "auto",
        position: "relative",
        boxShadow: "0 2px 16px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 24px"
      }}
      onClick={e => e.stopPropagation()}
    >
      <button
        style={{
          position: "absolute",
          top: 8,
          right: 12,
          fontSize: 24,
          color: "#888",
          background: "none",
          border: "none",
          cursor: "pointer",
          zIndex: 10
        }}
        onClick={() => setShowAvailableSlots(false)}
        aria-label="Close"
      >
        &times;
      </button>
     <AvailableSlots
  technicianName={
    availableSlotCategory
      ? categoryAssignments[availableSlotCategory]?.technician ||
        assignedInfo?.technician ||
        ''
      : assignedInfo?.technician || ''
  }
/>
    </div>
  </div>
)}

                {/* Attachments, Submit, etc. */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
                    {!getFieldAccess('image').hidden && (
                        <button
                            type="button"
                            onClick={() => setShowImageModal(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors relative"
                        >
                            Attach Image
                            {images.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {images.length}
                                </span>
                            )}
                        </button>
                    )}
                    {!getFieldAccess('video').hidden && (
                        <button
                            type="button"
                            onClick={() => setShowVideoModal(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors relative"
                        >
                            Attach Video
                            {videos.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {videos.length}
                                </span>
                            )}
                        </button>
                    )}
                    {userRole === 'system administrator' && (
                     <button
  type="button"
  className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors"
  onClick={() => {
    navigate('/Pending Complaints Register', {
      state: {
        viewType: returnTo === 'detailed' ? 'detailed' : viewType,
        complaintType,
      }
    });
  }}
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
  Back
</button>
                    )}
                    
                {userRole === "system administrator" ? (
    // Assign/Reassign button in assign mode
    fromDetailedView && viewType === "assign" ? (
     <AdminActionButton
  action={assignedInfo ? "reassign" : "assign"}
  onClick={handleAssign}
  disabled={assignLoading || isVisited}
/>
    ) : // Next button in normal admin mode
    !fromDetailedView && viewType !== "assign" ? (
      <AdminActionButton
        action="next"
        onClick={handleNext}
        disabled={complaint?.status === "ASSIGNED" || !!complaint?.Aupdate}
      />
    ) : // Submit button for admin (if needed)
    (
      <AdminActionButton
        action="submit"
        onClick={handleSubmit}
        disabled={complaint?.status === "ASSIGNED" || !!complaint?.Aupdate}
      />
    )
  ) : userRole === "branch" ? (
    <>
        {allowedSubmit && allowedSubmit.length > 0 && (
    <BranchActionButton
      isUpdate={!!complaint?.id}
      onClick={handleSubmit}
      disabled={complaint?.status === "APPROVED" || !!complaint?.Aupdate}
    />
  )}
   {}
{(complaint?.authLevel === 1 || complaint?.authLevel === 2) && (
  <>
    {allowedApprove && allowedApprove.length > 0 && (
      <ApproveButton
        onClick={handleApprove}
        disabled={complaint?.status === "APPROVED" || !!complaint?.Aupdate}
      />
    )}
    {allowedCancel && allowedCancel.length > 0 && (
      <CancelButton
        onClick={handleCancel}
        disabled={complaint?.status === "APPROVED" || !!complaint?.Aupdate}
      />
    )}
  </>
)}
    </>
  ) : null}
</div>
                </div>
            
            <ValidationPopup
                isOpen={showValidationPopup}
                onClose={() => setShowValidationPopup(false)}
                errors={validationErrors}
                title="Required Fields Missing"
                confirmButtonText="OK"
                confirmButtonColor="red"
            />
            <ImageModal
                isOpen={showImageModal}
                onClose={() => setShowImageModal(false)}
                images={images}
                onImageSelect={e => setImages(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 10))}
                onRemoveImage={idx => setImages(prev => prev.filter((_, i) => i !== idx))}
            />
            <VideoModal
                isOpen={showVideoModal}
                onClose={() => setShowVideoModal(false)}
                videos={videos}
                onVideoSelect={e => setVideos(prev => [...prev, ...Array.from(e.target.files || [])].slice(0, 10))}
                onRemoveVideo={idx => setVideos(prev => prev.filter((_, i) => i !== idx))}
            />
             <ValidationPopup
                isOpen={showSuccessPopup}
                onClose={() => {
                  setShowSuccessPopup(false);
                  setAssignSuccessMsg(null);
                }}
                errors={[]} // no errors
                title="Success"
                message={assignSuccessMsg || "Complaint submitted successfully!"}
                confirmButtonText="OK"
                confirmButtonColor="green"
            />
        </>
    );
}