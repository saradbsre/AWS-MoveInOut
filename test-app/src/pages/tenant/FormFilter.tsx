import React, { useState, useEffect, useRef } from 'react';
import * as ContractAPI from '@/services/Transaction/Contract/Contractapi';

interface Equipment {
  group: string;
  category: string;
  brand: string;
  subbrand: string;
  itemno: string;
  itemname: string;
}

// interface EquipmentType {
//   type: string;
//   details: Equipment[];
// }

export interface SelectedItem {
  id: string;
  itemno: string;
  itemname: string;
  unit: string;
  qty: number;
  status: 'good' | 'not working';
  remarks: string;
  category?: string;   
  roomType?: string;
}

interface EquipmentSectionProps {
  selectedBuilding: string;
  selectedUnit: string;
  selectedItems?: SelectedItem[];
  onEquipmentChange?: (selectedItems: SelectedItem[]) => void;
  unitMasterDesc?: string;
  filterResetKey?: number;
}

interface FilterRow {
  id: string;
  type: string;
  detail: string;
}

const ROOM_TYPES = [
  "Living Room", "Bedroom", "Kitchen", "Bathroom", "Balcony",
  "Hallway", "Parking", "Garden", "Roof", "Common Area"
];

const CATEGORIES = [
  "Electrical", "Plumbing", "AC", "Carpentry", "Cleaning",
  "Painting", "Pest Control", "Civil Work", "Others"
];

const ISSUE_ITEMS: Record<string, string[]> = {
  Electrical: ["Light", "Switchboard", "Power Socket", "Ceiling Fan"],
  Plumbing: ["Tap", "Shower", "Drain", "Water Heater"],
  AC: ["Cooling issue", "Water leakage", "Remote not working"],
  Carpentry: ["Door", "Window", "Lock", "Handle"],
  Cleaning: ["Floor", "Wall", "Window", "Ceiling"],
  Painting: ["Wall", "Ceiling", "Door", "Window"],
  "Pest Control": ["Cockroach", "Ant", "Rodent", "Termite"],
  "Civil Work": ["Tile", "Wall Crack", "Leakage", "Floor"],
  Others: ["Other"]
};

export default function EquipmentSection({ 
  selectedUnit,
  selectedItems = [],
  onEquipmentChange,
  unitMasterDesc,
  filterResetKey 
}: EquipmentSectionProps) {
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [availableFieldTypes, setAvailableFieldTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  // Item search and selection
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);

  // Filter management
  const [filterRows, setFilterRows] = useState<FilterRow[]>([]);
  const [currentFilterType, setCurrentFilterType] = useState('');
  const [currentFilterDetailSearchTerm, setCurrentFilterDetailSearchTerm] = useState('');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isDetailDropdownOpen, setIsDetailDropdownOpen] = useState(false);

  // New state for filters

  const [roomType, setRoomType] = useState('');
  const [category, setCategory] = useState('');
  const [issueItem, setIssueItem] = useState('');
  const [issueItemSearch, setIssueItemSearch] = useState('');
  const [isIssueDropdownOpen, setIsIssueDropdownOpen] = useState(false);
  const issueDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRoomType('');
    setCategory('');
    setIssueItem('');
    setIssueItemSearch('');
  }, [filterResetKey]);

 const filteredIssueItems = category
  ? (ISSUE_ITEMS[category] || [])
      .filter(item => item.toLowerCase().includes(issueItemSearch.toLowerCase()))
      .map(item => ({
        label: item,
        value: `${category}|${item}`,
        category,
        item
      }))
  : [];


  const dropdownRefs = {
    item: useRef<HTMLDivElement>(null),
    type: useRef<HTMLDivElement>(null),
    detail: useRef<HTMLDivElement>(null)
  };

  // Fetch equipment data
  useEffect(() => {
    // Don't fetch if no unit is selected
    if (!selectedUnit) {
      setEquipmentData([]);
      setAvailableFieldTypes([]);
      return;
    }

    const fetchEquipmentData = async () => {
      setLoading(true);
      try {
        const data = await ContractAPI.getEquipment();
        
        setEquipmentData(data.equipment);
        setAvailableFieldTypes(data.fieldTypes);
      } catch {
        // Clear data on error
        setEquipmentData([]);
        setAvailableFieldTypes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipmentData();
  }, [selectedUnit]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        issueDropdownRef.current &&
        !issueDropdownRef.current.contains(event.target as Node)
      ) {
        setIsIssueDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group equipment by category (type)
  // const groupEquipmentByType = (equipment: Equipment[]): EquipmentType[] => {
  //   const grouped = equipment.reduce((acc, item) => {
  //     const type = item.category;
  //     if (!acc[type]) {
  //       acc[type] = [];
  //     }
  //     acc[type].push(item);
  //     return acc;
  //   }, {} as Record<string, Equipment[]>);

  //   return Object.entries(grouped).map(([type, details]) => ({
  //     type,
  //     details
  //   }));
  // };

  // Apply filters to equipment data
  const getFilteredEquipment = () => {
    if (filterRows.length === 0) {
      return equipmentData;
    }

    return equipmentData.filter(item => {
      return filterRows.every(filter => {
        switch (filter.type.toLowerCase()) {
          case 'group':
            return item.group === filter.detail;
          case 'category':
            return item.category === filter.detail;
          case 'brand':
            return item.brand === filter.detail;
          case 'sub brand':
            return item.subbrand === filter.detail;
          case 'item no':
            return item.itemno === filter.detail;
          // case 'item name':
          //   return item.itemname === filter.detail;
          default:
            return true;
        }
      });
    });
  };

  // Filter items by search term from filtered equipment
  const searchFilteredItems = getFilteredEquipment().filter(item =>
    item.itemname.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  // Get available field types (excluding already used in filters)
  const getAvailableFieldTypes = () => {
    const usedTypes = filterRows.map(row => row.type);
    return availableFieldTypes.filter(type => !usedTypes.includes(type));
  };

  // Get details for selected type
  const getDetailsForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'group':
        return equipmentData.map(item => ({ ...item, displayValue: item.group }));
      case 'category':
        return equipmentData.map(item => ({ ...item, displayValue: item.category }));
      case 'brand':
        return equipmentData.map(item => ({ ...item, displayValue: item.brand }));
      case 'sub brand':
        return equipmentData.map(item => ({ ...item, displayValue: item.subbrand }));
      case 'item no':
        return equipmentData.map(item => ({ ...item, displayValue: item.itemno }));
      // case 'item name':
      //   return equipmentData.map(item => ({ ...item, displayValue: item.itemname }));
      default:
        return equipmentData.map(item => ({ ...item, displayValue: item.itemname }));
    }
  };

  // Filter details by search term
  const filteredDetails = currentFilterType ? 
    getDetailsForType(currentFilterType).filter((detail, index, self) => 
      // Remove duplicates and filter by search term
      self.findIndex(d => d.displayValue === detail.displayValue) === index &&
      detail.displayValue.toLowerCase().includes(currentFilterDetailSearchTerm.toLowerCase())
    ) : [];

  // Handle dropdown clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(dropdownRefs).forEach(([key, ref]) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          switch (key) {
            case 'item':
              setIsItemDropdownOpen(false);
              break;
            case 'type':
              setIsTypeDropdownOpen(false);
              break;
            case 'detail':
              setIsDetailDropdownOpen(false);
              break;
          }
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle adding item from search
  const handleAddItem = (item: Equipment) => {
    const newItem: SelectedItem = {
      id: `${item.itemno}-${Date.now()}`,
      itemno: item.itemno,
      itemname: item.itemname,
      unit: 'SQM', // Default unit
      qty: 1, // Default quantity
      status: 'good', // Set default status to 'good'
      remarks: ''
    };
  
  const updatedItems = [...selectedItems, newItem];
  onEquipmentChange?.(updatedItems);
  setItemSearchTerm('');
  setIsItemDropdownOpen(false);
  
  // Notify parent component
  onEquipmentChange?.(updatedItems);
};

// const handleItemQtyChange = (itemId: string, qty: number) => {
//   const updatedItems = selectedItems.map(item => 
//     item.id === itemId ? { ...item, qty: Math.max(1, qty) } : item
//   );
//   setSelectedItems(updatedItems);
//   onEquipmentChange?.(updatedItems);
// };
// const handleItemUnitChange = (itemId: string, unit: string) => {
//   const updatedItems = selectedItems.map(item => 
//     item.id === itemId ? { ...item, unit } : item
//   );
//   setSelectedItems(updatedItems);
//   onEquipmentChange?.(updatedItems);
// };

  // Handle filter type selection
  const handleFilterTypeSelect = (type: string) => {
    setCurrentFilterType(type);
    setCurrentFilterDetailSearchTerm('');
    setIsTypeDropdownOpen(false);
    setIsDetailDropdownOpen(true);
  };

  // Handle filter detail selection
  const handleFilterDetailSelect = (detail: Equipment & { displayValue: string }) => {
    const newFilter: FilterRow = {
      id: `filter-${Date.now()}`,
      type: currentFilterType,
      detail: detail.displayValue
    };

    setFilterRows(prev => [...prev, newFilter]);
    
    // Reset current filter selections
    setCurrentFilterType('');
    setCurrentFilterDetailSearchTerm('');
    setIsDetailDropdownOpen(false);
  };

  // Handle removing filter row
  const handleRemoveFilterRow = (filterId: string) => {
    setFilterRows(prev => prev.filter(row => row.id !== filterId));
  };

  // Handle item status change
  const handleItemStatusChange = (itemId: string, status: 'good' | 'not working') => {  
    const updatedItems = selectedItems.map(item => 
      item.id === itemId ? { ...item, status } : item
    );
    onEquipmentChange?.(updatedItems);
  };

  // Handle item remarks change
  const handleItemRemarksChange = (itemId: string, remarks: string) => {
    const updatedItems = selectedItems.map(item => 
      item.id === itemId ? { ...item, remarks } : item
    );
    onEquipmentChange?.(updatedItems);
  };

  // Handle removing item
  const handleRemoveItem = (itemId: string) => {
    const updatedItems = selectedItems.filter(item => item.id !== itemId);
    onEquipmentChange?.(updatedItems);
  };

  const ROOM_TYPE_MAP: Record<string, string[]> = {
  "STORE ROOM": ["Bathroom", "Balcony", "Hallway", "Parking", "Garden", "Roof", "Common Area", "Office Area"],
  "WAREHOUSE": ["Bathroom", "Balcony", "Hallway", "Parking", "Garden", "Roof", "Common Area", "Office Area"],
  "WAREHOUSE (FRONT)": ["Bathroom", "Balcony", "Hallway", "Parking", "Garden", "Roof", "Common Area", "Office Area"],
  "WAREHOUSE (BACK)": ["Bathroom", "Balcony", "Hallway", "Parking", "Garden", "Roof", "Common Area", "Office Area"],
  "WAREHOUSE - FACTORY": ["Bathroom", "Balcony", "Hallway", "Parking", "Garden", "Roof", "Common Area", "Office Area"],
  "WAREHOUSE - STORAGE": ["Bathroom", "Balcony", "Hallway", "Parking", "Garden", "Roof", "Common Area", "Office Area"],
  "STORE": ["Bathroom", "Balcony", "Hallway", "Parking", "Garden", "Roof", "Common Area", "Office Area"],
  "SHOWROOM": ["Bathroom", "Balcony", "Hallway", "Parking", "Garden", "Roof", "Common Area", "Office Area"],
  "OFFICE": ["Bathroom", "Balcony", "Hallway", "Parking", "Garden", "Roof", "Common Area", "Office Area"],
  "M1-FLOOR-OFFICE": ["Bathroom", "Balcony", "Hallway", "Parking", "Garden", "Roof", "Common Area", "Office Area"],
  "M2-FLOOR": ["Bathroom", "Balcony", "Hallway", "Parking", "Garden", "Roof", "Common Area", "Office Area"],
  "HEALTHCLUB": ["Bathroom", "Balcony", "Hallway", "Parking", "Garden", "Roof", "Common Area", "Office Area"],
  "COMMERCIAL": [
    "Bathroom", "Balcony", "Hallway", "Parking", "Garden", "Roof", "Common Area", "Office Area"
  ],
  "FIRST FLOOR": [
    "Bathroom", "Balcony", "Hallway", "Parking", "Garden", "Roof", "Common Area", "Office Area"
  ],
   

  // For all other unit_master_desc, show all ROOM_TYPES
};
 const allowedRoomTypes =
  unitMasterDesc && ROOM_TYPE_MAP[unitMasterDesc.toUpperCase()]
    ? ROOM_TYPE_MAP[unitMasterDesc.toUpperCase()]
    : ROOM_TYPES;

  return (
    <div className="space-y-4">
    

      {/* Active Filter Rows */}
      {filterRows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterRows.map((filter) => (
            <div key={filter.id} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {filter.type}: {filter.detail}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveFilterRow(filter.id)}
                className="text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full p-1 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filter Type and Detail Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filter Type Dropdown */}
        <div className="relative" ref={dropdownRefs.type}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room Type<span className="text-red-600">*</span></label>
           <select
  value={roomType}
  onChange={e => setRoomType(e.target.value)}
  className="w-full border border-gray-300 rounded-lg p-2"
>
  <option value="">Select Room Type...</option>
  {allowedRoomTypes.map(rt => (
    <option key={rt} value={rt}>{rt}</option>
  ))}
</select>
          
        
        </div>
           <div className="relative" ref={dropdownRefs.type}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category<span className="text-red-600">*</span></label>
                  <select
          value={category}
          onChange={e => {
            setCategory(e.target.value);
            setIssueItem('');
            setIssueItemSearch('');
          }}
          className="w-full border border-gray-300 rounded-lg p-2"
        >
          <option value="">Select Category...</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        </div>
        {/* Filter Detail Search Dropdown */}
        <div className="relative" ref={issueDropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Equipment<span className="text-red-600">*</span></label>
        <input
          type="text"
          placeholder="Search Equipment..."
          value={issueItemSearch}
          onChange={e => {
            setIssueItemSearch(e.target.value);
            setIsIssueDropdownOpen(true);
          }}
          onFocus={() => setIsIssueDropdownOpen(true)}
          className="w-full border border-gray-300 rounded-lg p-2"
        />
        {isIssueDropdownOpen && filteredIssueItems.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
            {filteredIssueItems.map(option => (
              <li
                key={option.value}
                className={`px-4 py-2 cursor-pointer hover:bg-blue-100`}
                onClick={() => {
  // Prevent duplicates
   if (!selectedItems.some(i => i.itemname === option.label && i.category === category && i.roomType === roomType)) {
    const newItem: SelectedItem = {
      id: `${option.value}-${Date.now()}`,
      itemno: option.value, // or use a better unique value if available
      itemname: option.label,
      unit: 'PCS', // or your default unit
      qty: 1,      // default quantity
      status: 'good', // or your default status
      remarks: '',
      category,
      roomType,
    };
    onEquipmentChange?.([...selectedItems, newItem]);
  }
  setIssueItem(option.value);
  setIssueItemSearch('');
  setIsIssueDropdownOpen(false);
}}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>

      {/* Selected Items Display */}
      {selectedItems.map((item) => (
  <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border flex items-center gap-3">
    <div className="font-medium text-gray-700 dark:text-gray-300 flex-1">
      {item.itemname}
      {item.roomType && <span className="ml-2 text-xs text-gray-500">({item.roomType})</span>}
      {item.category && <span className="ml-2 text-xs text-gray-500">[{item.category}]</span>}
    </div>
    <input
      type="text"
      value={item.remarks}
      onChange={e => {
        const updated = selectedItems.map(i =>
          i.id === item.id ? { ...i, remarks: e.target.value } : i
        );
        onEquipmentChange?.(updated);
      }}
      placeholder="Remarks..."
      className="flex-1 border border-gray-300 rounded p-2 text-sm bg-white min-w-0"
    />
    <button
      type="button"
      onClick={() => {
        const updated = selectedItems.filter(i => i.id !== item.id);
        onEquipmentChange?.(updated);
      }}
      className="text-red-600 hover:text-red-800 px-2 py-2 hover:bg-red-50 rounded border border-gray-300 bg-white flex-shrink-0 min-w-[32px] flex items-center justify-center"
    >
      ✕
    </button>
  </div>
))}
    </div>
  );
}