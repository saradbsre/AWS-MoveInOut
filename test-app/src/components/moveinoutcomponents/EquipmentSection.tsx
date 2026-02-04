import React, { useState, useEffect, useRef } from 'react';
import * as ContractAPI from '@/services/Transaction/Contract/Contractapi';

interface Equipment {
  group: string;
  category: string;
  brand: string;
  subbrand: string;
  itemno: string;
  itemname: string;
  brdcode: string;
  subcode: string;
  majunit: string;
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
  brdcode: string;
  subcode: string;
  status: 'good' | 'not working';
  remarks: string;
  roomType?: string;
  category?: string;
}

interface EquipmentSectionProps {
  selectedBuilding: string;
  selectedUnit: string;
  selectedItems?: SelectedItem[];
  onEquipmentChange?: (selectedItems: SelectedItem[]) => void;
}

interface FilterRow {
  id: string;
  type: string;
  detail: string;
}

export default function EquipmentSection({ 
  selectedUnit,
  selectedItems = [],
  onEquipmentChange 
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
        
        setEquipmentData(
          data.equipment.map((item: any) => ({
            group: item.grpcode,
            category: item.sscode,
            brand: item.brdcode,
            subbrand: item.subcode,
            itemno: item.itemno,
            itemname: item.itemname,
            majunit: item.majunit
          }))
        );
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
          case 'subbrand':
            return item.subbrand === filter.detail;
          case 'itemno':
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
      case 'subbrand':
        return equipmentData.map(item => ({ ...item, displayValue: item.subbrand }));
      case 'itemno':
        return equipmentData.map(item => ({ ...item, displayValue: item.itemno }));
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
      unit: item.majunit, // Default unit
      brdcode: item.brand,
      subcode: item.subbrand,
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

  // Handle qty change: if input is empty, set qty to 0; else set to entered value (minimum 0)
  const handleItemQtyChange = (itemId: string, qty: string) => {
    const parsedQty = qty === '' ? 0 : Math.max(1, Number(qty));
    const updatedItems = selectedItems.map(item =>
      item.id === itemId
        ? { ...item, qty: parsedQty }
        : item
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter Type</label>
          <button
            type="button"
            onClick={() => (selectedUnit && !loading) ? setIsTypeDropdownOpen(!isTypeDropdownOpen) : null}
            disabled={!selectedUnit || loading} // Add loading condition
            className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-left flex justify-between items-center ${
              (!selectedUnit || loading)
                ? 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50' 
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <span>
              {loading
                ? 'Loading filter types...'
                : !selectedUnit 
                  ? 'Select unit first...' 
                  : (currentFilterType || 'Select filter type...')
              }
            </span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isTypeDropdownOpen && !loading && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {getAvailableFieldTypes().length > 0 ? (
                getAvailableFieldTypes().map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleFilterTypeSelect(type)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white first:rounded-t-lg last:rounded-b-lg"
                  >
                    {type}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                  No filter types available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Detail Search Dropdown */}
        <div className="relative" ref={dropdownRefs.detail}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter Details</label>
          <input
            type="text"
            value={currentFilterDetailSearchTerm}
            onChange={(e) => {
              setCurrentFilterDetailSearchTerm(e.target.value);
              setIsDetailDropdownOpen(true);
            }}
            onFocus={() => setIsDetailDropdownOpen(true)}
            placeholder={
              loading
                ? 'Loading...'
                : !selectedUnit
                  ? 'Select unit first...'
                  : currentFilterType 
                    ? 'Search filter details...' 
                    : 'Select filter type first...'
            }
            disabled={!currentFilterType || !selectedUnit || loading} // Add loading condition
            className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 placeholder-gray-500 dark:placeholder-gray-400 ${
              (!currentFilterType || !selectedUnit || loading)
                ? 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}
          />
          
          {isDetailDropdownOpen && currentFilterType && !loading && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredDetails.length > 0 ? (
                filteredDetails.map((detail, index) => (
                  <button
                    key={`${detail.itemno}-${index}`}
                    type="button"
                    onClick={() => handleFilterDetailSelect(detail)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white first:rounded-t-lg last:rounded-b-lg"
                  >
                    {detail.displayValue}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
                  No details found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Equipment Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <label className="font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">Equipment:</label>
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1" ref={dropdownRefs.item}>
            <input
              type="text"
              value={itemSearchTerm}
              onChange={(e) => {
                setItemSearchTerm(e.target.value);
                setIsItemDropdownOpen(true);
              }}
              disabled={!selectedUnit || loading} // Add loading condition
              onFocus={() => selectedUnit && !loading ? setIsItemDropdownOpen(true) : null}
              placeholder={
                loading 
                  ? 'Loading equipment...' 
                  : !selectedUnit 
                    ? 'Select unit first...' 
                    : 'Search equipment...'
              }
              className={`border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full placeholder-gray-500 dark:placeholder-gray-400 ${
                (!selectedUnit || loading)
                  ? 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            />
            {isItemDropdownOpen && searchFilteredItems.length > 0 && !loading && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchFilteredItems.map((item, index) => (
                  <button
                    key={`${item.itemno}-${index}`}
                    type="button"
                    onClick={() => handleAddItem(item)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white first:rounded-t-lg last:rounded-b-lg"
                  >
                    {item.itemname}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Items Display */}
      {selectedItems.map((item) => (
        <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            
            {/* Item Name */}
            <div className="font-medium text-gray-700 dark:text-gray-300 lg:flex-1 lg:min-w-0">
              {item.itemname}
            </div>
            
            {/* Status Radio Buttons */}
            <div className="flex flex-wrap gap-4 lg:justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`status-${item.id}`}
                  value="good"
                  checked={item.status === 'good'}
                  onChange={() => {
                    handleItemStatusChange(item.id, 'good');
                  }}
                  style={{
                    accentColor: '#16a34a',
                    width: '16px',
                    height: '16px'
                  }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">Good</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`status-${item.id}`}
                  value="not working"
                  checked={item.status === 'not working'}
                  onChange={() => {
                    handleItemStatusChange(item.id, 'not working');
                  }}
                  style={{
                    accentColor: '#dc2626',
                    width: '16px',
                    height: '16px'
                  }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">Not Working</span>
              </label>
            </div>
            
            {/* Qty, Remarks and Remove Button */}
            <div className="flex gap-3 lg:w-50">
              {/* Qty input */}
              <input
                type="number"
                value={item.qty === 0 ? '' : item.qty}
                min={0}
                onChange={(e) => handleItemQtyChange(item.id, e.target.value)}
                placeholder="QTY..."
                className="w-16 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-0"
              />
              <input
                type="text"
                value={item.remarks}
                onChange={(e) => handleItemRemarksChange(item.id, e.target.value)}
                placeholder="Remarks..."
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-0"
              />
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="text-red-600 hover:text-red-800 px-2 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 flex-shrink-0 min-w-[32px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>        
          </div>
        </div>
      ))}
    </div>
  );
}