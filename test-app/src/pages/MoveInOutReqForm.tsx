import React, { useState, useEffect } from 'react';
import * as ContractAPI from '@/services/Transaction/Contract/Contractapi';
import { canUserAdd } from '@/utils/moduleAccess';
import ValidationPopup from '@/components/ValidationPopup';
import '../styles/Moveinout.css';
import { formatDateShort } from '@/utils/DateFormat';

interface Technician {
  tech_id: string;
  tech_name: string;
}

// Add a type for the modal props
interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: Technician[];
  scheduleDate: string;
}

interface Contract {
  contract_id: string;
  build_id: string;
  unit_desc: string;
  build_desc: string;
}

// Dummy modal for "See Schedule"
function ScheduleModal({ isOpen, onClose, technicians, scheduleDate }: ScheduleModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Technician Schedule for {scheduleDate || '...'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 text-xl font-bold">&times;</button>
        </div>
        <div>
          {technicians.length === 0 ? (
            <div className="text-gray-500">No technicians found.</div>
          ) : (
            <ul className="divide-y">
              {technicians.map(t => (
                <li key={t.tech_id} className="py-2 flex justify-between">
                  <span>{t.tech_name}</span>
                  {/* Replace with real work info */}
                  <span className="text-sm text-gray-500">Work: 2 jobs</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

interface Building {
  build_id: string;
  build_desc: string;
}
interface Unit {
  unit_desc: string;
}
interface Technician {
  tech_id: string;
  tech_name: string;
}

export default function Moveinout() {
  const [moveType, setMoveType] = useState<'moveIn' | 'moveOut'>('moveIn');
  const [contractSearch, setContractSearch] = useState('');
  const [contractOptions, setContractOptions] = useState<Contract[]>([]);
  const [showContractDropdown, setShowContractDropdown] = useState(false);
  const [selectedContract, setSelectedContract] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [tenantDetails, setTenantDetails] = useState<any>(null);
  const [unitSearch, setUnitSearch] = useState('');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  const [date, setDate] = useState('');
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [technicianSearch, setTechnicianSearch] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const canAdd = canUserAdd('Move &In Register');
  

 

   // Fetch contracts from API
  useEffect(() => {
    ContractAPI.getContracts().then((data: { contracts: Contract[] }) => {
      setContractOptions(data.contracts || []);
    });
  }, []);

  // Filter contracts that start with the input
 const filteredContracts = contractOptions.filter(c =>
  contractSearch && c.contract_id.toLowerCase().startsWith(contractSearch.toLowerCase())
);

  // When a contract is selected, update related fields
const handleContractSelect = (contract: Contract) => {
  setContractSearch(contract.contract_id);
  setSelectedContract(contract.contract_id);
  setShowContractDropdown(false);

  // Fetch tenant info by contractId
  ContractAPI.getTenantInfo(undefined, undefined, contract.contract_id).then(data => {
    if (data && data.success !== false) {
      setSelectedBuilding(data.building || contract.build_desc);
      setSelectedBuildingId(data.build_id || contract.build_id);
      setSelectedUnits(data.unit ? [data.unit] : []);
      // Set tenant details if available
      if (data.tenants && data.tenants.length > 0) {
        setTenantDetails(data.tenants[0]);
      } else {
        setTenantDetails(null);
      }
    } else {
      setTenantDetails(null);
    }
  });
};

    useEffect(() => {
    if (selectedBuildingId) {
        ContractAPI.getUnits(selectedBuildingId, selectedContract).then(data => setUnits(data.units || []));
    } else {
        setUnits([]);
        setSelectedUnits([]);
    }
    }, [selectedBuildingId, selectedContract]);

 const handleUnitCheckbox = (unitValue: string) => {
  setSelectedUnits(prev => {
    const updated = prev.some(u => u.trim().toLowerCase() === unitValue.trim().toLowerCase())
      ? prev.filter(u => u.trim().toLowerCase() !== unitValue.trim().toLowerCase())
      : [...prev, unitValue];
    //console.log('Selected Units:', updated);
    return updated;
  });
};
useEffect(() => {
  ContractAPI.getTechnicians().then((data: { technicians: any[] }) => {
    setTechnicians(
      (data.technicians || []).map(t => ({
        tech_id: t.Uname || t.tech_id || '',
        tech_name: t.Uname || t.tech_name || '',
      }))
    );
  });
}, []);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!selectedContract) errors.push('Contract is required');
    if (!selectedBuilding) errors.push('Building is required');
    if (selectedUnits.length === 0) errors.push('At least one unit must be selected');
    if (!date) errors.push('Date is required');
    if (!selectedTechnician) errors.push('Technician is required');
    if (!scheduleDate) errors.push('Schedule date is required');
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationPopup(true);
      return;
    }
    alert('Form submitted!');
  };

  
const filteredTechnicians = technicians.filter(
  t => typeof t.tech_name === 'string' && t.tech_name.toLowerCase().includes(technicianSearch.toLowerCase())
);

  return (
    <form
      className="p-6 max-w-4xl mx-auto space-y-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
      onSubmit={handleSubmit}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Move In Move Out Request Form</h2>
        <hr className="mt-4 mb-2 border-gray-300" />
      </div>

      {/* Row 1: Contract ID with search icon, MoveIn/MoveOut Toggle */}
      <div className="flex flex-row gap-4 items-center mb-2">
        <div className="flex-1 flex flex-col">
          <label className="font-semibold mb-1">Contract</label>
          <div className="relative w-full">
 <input
  type="text"
  value={contractSearch}
  onChange={e => {
    setContractSearch(e.target.value);
    setShowContractDropdown(true);
    setSelectedBuilding('');      // Clear building
    setUnits([]);                 // Clear units
    setSelectedUnits([]);         // Clear selected units
    setTenantDetails(null);       // Clear tenant details
  }}
  onFocus={() => setShowContractDropdown(true)}
  onBlur={() => setTimeout(() => setShowContractDropdown(false), 150)}
  placeholder="Search Contract ID..."
  className="border rounded p-2 w-full h-11 pr-10"
/>
  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  </span>
  {showContractDropdown && contractSearch && filteredContracts.length > 0 && (
    <div className="absolute z-10 left-0 right-0 bg-white border border-gray-300 rounded shadow mt-1 max-h-48 overflow-y-auto">
      {filteredContracts.map(c => (
        <div
          key={c.contract_id}
          className="px-4 py-2 cursor-pointer hover:bg-blue-100"
          onMouseDown={() => handleContractSelect(c)}
        >
          {c.contract_id}
        </div>
      ))}
    </div>
  )}
</div>
        </div>
        <div className="flex flex-col items-end">
          <label className="invisible mb-1">Toggle</label>
          <div className="flex border border-blue-400 rounded-lg overflow-hidden h-11">
            <button
              type="button"
              className={`px-6 font-semibold ${moveType === 'moveIn' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
              style={{ transition: 'background 0.2s', height: '100%' }}
              onClick={() => setMoveType('moveIn')}
            >
              Move In
            </button>
            <button
              type="button"
              className={`px-6 font-semibold ${moveType === 'moveOut' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
              style={{ transition: 'background 0.2s', height: '100%' }}
              onClick={() => setMoveType('moveOut')}
            >
              Move Out
            </button>
          </div>
        </div>
      </div>
      {tenantDetails && (
  <div className="mb-4 border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tenant:</label>
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{tenantDetails?.tenantName || 'N/A'}</div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date:</label>
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {formatDateShort(tenantDetails?.startDate)}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date:</label>
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {formatDateShort(tenantDetails?.endDate)}
        </div>
      </div>
    </div>
  </div>
)}
      {/* Row 2: Building (disabled input) and Unit */}
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <div className="flex-1">
          <label className="font-semibold">Building</label>
          <input
            type="text"
            value={selectedBuilding}
            disabled
            className="border rounded p-2 w-full bg-gray-100 text-gray-500"
            style={{ minHeight: '40px' }}
          />
        </div>
       <div className="flex-1">
  <label className="font-semibold">Unit</label>
  <div className="relative">
    <input
      type="text"
      value={unitSearch}
      onChange={e => setUnitSearch(e.target.value)}
      onFocus={() => setShowUnitDropdown(true)}
      onBlur={() => setTimeout(() => setShowUnitDropdown(false), 150)}
      placeholder="Search Unit..."
      className="border rounded p-2 w-full mb-2"
    />
    {showUnitDropdown && (
      <div className="border rounded bg-white max-h-40 overflow-y-auto absolute w-full z-10">
        
        {units
  .filter(unit =>
    unit.unit_desc.toLowerCase().includes(unitSearch.toLowerCase())
  )
  .map(unit => (
    <label
      key={unit.unit_desc}
      className="flex items-center gap-2 px-2 py-1 hover:bg-blue-50 cursor-pointer"
    >
    <input
  type="checkbox"
  checked={selectedUnits.some(u => u.trim().toLowerCase() === unit.unit_desc.trim().toLowerCase())}
  onChange={() => handleUnitCheckbox(unit.unit_desc)}
  onMouseDown={e => e.preventDefault()} // Prevents dropdown from closing on click
/>
      {unit.unit_desc}
    </label>
  ))}
        {units.length === 0 && (
          <div className="px-2 py-1 text-gray-400">No units available</div>
        )}
      </div>
    )}
  </div>
</div>
      </div>

      {/* Row 3: Date and Selected Units */}
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <div className="flex-1">
          <label className="font-semibold">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border rounded p-2 w-full"
            style={{ minHeight: '40px' }}
          />
        </div>
        <div className="flex-1">
          <label className="font-semibold">Selected Units</label>
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {selectedUnits.map(unit => (
              <span key={unit} className="px-2 py-1 bg-blue-100 rounded">{unit}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Technician, Schedule, Assign buttons */}
      <div className="flex flex-col md:flex-row gap-4 mb-2">
 <div className="flex-1">
  <label className="font-semibold">Technician</label>
  <select
    value={selectedTechnician}
    onChange={e => setSelectedTechnician(e.target.value)}
    className="border rounded p-2 w-full"
    style={{ minHeight: '40px' }}
  >
    <option value="">Select Technician...</option>
    {technicians.map(t => (
      <option key={t.tech_id} value={t.tech_id}>
        {t.tech_name}
      </option>
    ))}
  </select>
</div>
  <div className="flex-1 flex flex-col justify-end">
    <div className="flex gap-2 mt-6">
      <button
        type="button"
        className="px-4 py-2 bg-white text-black rounded border border-black-400 hover:bg-green-700 hover:text-white transition-colors"
        onClick={() => setShowScheduleModal(true)}
      >
        See Schedule
      </button>
      <button
        type="button"
        className="px-4 py-2 bg-white text-black rounded border border-black-400 hover:bg-green-700 hover:text-white transition-colors"
        onClick={() => {
          // Assign logic here
          if (!technicianSearch || !scheduleDate) {
            setValidationErrors(['Please select technician and schedule date before assigning.']);
            setShowValidationPopup(true);
            return;
          }
          setSelectedTechnician(technicianSearch);
          alert('Assigned!');
        }}
      >
        Assign
      </button>
    </div>
  </div>
</div>

{/* Row 5: Submit and Reschedule bottom right */}
<div className="flex justify-end mt-6 gap-2">
  <button
    type="button"
    className="px-6 py-2 bg-white text-black-600 border border-black-400 rounded hover:bg-red-600 hover:text-white transition-colors"
    onClick={() => alert('Reschedule logic here')}
  >
    Reschedule
  </button>
  {canAdd && (
    <button
            type="button"
            className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg border border-green-700 transition-colors sm:min-w-[120px]"
            
          >
            Submit
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
  )}
</div>

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        technicians={technicians}
        scheduleDate={scheduleDate}
      />

      <ValidationPopup
        isOpen={showValidationPopup}
        onClose={() => setShowValidationPopup(false)}
        errors={validationErrors}
        title="Required Fields Missing"
        message="Please complete the following before proceeding:"
        confirmButtonText="OK"
        confirmButtonColor="green"
      />
    </form>
  );
}