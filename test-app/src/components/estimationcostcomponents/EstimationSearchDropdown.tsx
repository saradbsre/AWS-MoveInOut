import React, { useState, useEffect, useRef } from 'react';

interface Estimation {
  Srno: number;
  Trno: number;
  RefNum: string;
  TenantName: string;
  building_id: string;
  unit_desc: string;
  AuthStatus: string;
  TrDate: string;
}

interface EstimationSearchDropdownProps {
  onSelect: (srno: number) => void;
}

export default function EstimationSearchDropdown({ onSelect }: EstimationSearchDropdownProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [estimations, setEstimations] = useState<Estimation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEstimation, setSelectedEstimation] = useState<Estimation | null>(null);
  const [justSelected, setJustSelected] = useState(false); // Add this flag
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch estimations when search term changes
  useEffect(() => {
    const fetchEstimations = async () => {
      if (searchTerm.length < 2 || justSelected) {
        setEstimations([]);
        return;
      }

      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const response = await fetch(
          `${apiUrl}/api/search-estimations?search=${encodeURIComponent(searchTerm)}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        
        if (data.success) {
          setEstimations(data.estimations);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error fetching estimations:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchEstimations, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, justSelected]);

  const handleSelect = (estimation: Estimation) => {
      setJustSelected(true); // Set flag to prevent reopening
      setSelectedEstimation(estimation);
      setSearchTerm(estimation.RefNum);
      setEstimations([]); // Clear list first
      setIsOpen(false); // Then close dropdown
      
      // Call onSelect after a brief delay
      setTimeout(() => {
          onSelect(estimation.Srno);
      }, 100);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedEstimation(null);
    setEstimations([]);
    setIsOpen(false);
    setJustSelected(false);
  };

  const handleFocus = () => {
    // Only open if not just selected and has valid search term
    if (!justSelected && searchTerm.length >= 2 && estimations.length > 0) {
      setIsOpen(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setJustSelected(false); // Reset flag when user types
  };

  return (
    <div className="relative mb-4" ref={dropdownRef}>
      <label className="block font-medium mb-2">Search Estimation by Reference Number</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={handleChange}
            onFocus={handleFocus}
            placeholder="Type reference number to search..."
            className="border rounded p-2 w-full pr-10"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
          {searchTerm && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Dropdown list */}
      {isOpen && estimations.length > 0 && !justSelected && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded shadow-lg max-h-96 overflow-y-auto">
          {estimations.map((estimation) => (
            <div
              key={estimation.Srno}
              onClick={() => handleSelect(estimation)}
              className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{estimation.RefNum}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {estimation.TenantName} • {estimation.building_id} / {estimation.unit_desc}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    TRNO: {estimation.Trno} • Date: {estimation.TrDate?.slice(0, 10)}
                  </div>
                </div>
                <div className="ml-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    estimation.AuthStatus === 'Approved' 
                      ? 'bg-green-100 text-green-800' 
                      : estimation.AuthStatus?.includes('Rejected')
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {estimation.AuthStatus}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && estimations.length === 0 && searchTerm.length >= 2 && !loading && !justSelected && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded shadow-lg p-3 text-center text-gray-500">
          No estimations found
        </div>
      )}
    </div>
  );
}