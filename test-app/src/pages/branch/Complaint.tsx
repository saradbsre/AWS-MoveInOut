import React, { useState } from 'react';
import ValidationPopup from '@/components/ValidationPopup';

interface CategoryItem {
  category: string;
  remarks: string;
}

interface ComplaintReportData {
  building: string;
  submissionDate: string;
  username: string;
  status: string;
  categories: CategoryItem[];
  type: 'indoor' | 'outdoor';
  block: string;
  place: string;
}

export default function BranchComplaintForm() {
  const [buildingValue] = useState(''); // Set your building value here
  const [blockValue] = useState('');
  const [placeValue] = useState('');
  const [type, setType] = useState<'indoor' | 'outdoor'>('indoor');
  const [categories, setCategories] = useState<CategoryItem[]>([{ category: '', remarks: '' }]);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [reportData, setReportData] = useState<ComplaintReportData | null>(null);
  const [currentView, setCurrentView] = useState<'form' | 'report'>('form');
  const username = sessionStorage.getItem('username') || '';

  // Handlers for category rows
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

  // Validation and submit
  const handleSubmit = () => {
    const errors: string[] = [];
    if (categories.some(cat => !cat.category)) errors.push('All categories are required');
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationPopup(true);
      return;
    }
    const complaintData: ComplaintReportData = {
      building: buildingValue,
      submissionDate: new Date().toISOString(),
      username,
      status: 'pending',
      categories,
      type,
      block: blockValue,
      place: placeValue,
    };
    setReportData(complaintData);
    setCurrentView('report');
  };

  // Form UI
  if (currentView === 'form') {
    return (
      <>
        <div className="p-4 max-w-3xl mx-auto space-y-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
          <div className="text-center border-b border-gray-300 dark:border-gray-600 pb-4">
            <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              Branch Complaint Form
            </h1>
          </div>
          {/* Row: Building and Indoor/Outdoor Toggle */}
          <div className="flex gap-4 mb-4">
            {/* Building (disabled input) */}
            <div className="w-2/3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Building
              </label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 bg-gray-100"
                value={buildingValue}
                disabled
                placeholder="Building"
              />
            </div>
            {/* Indoor/Outdoor Toggle */}
            <div className="w-1/3 flex items-end">
              <div className="flex rounded-lg overflow-hidden border border-blue-500 w-full">
                <button
                  type="button"
                  className={`flex-1 px-4 py-2 text-sm font-medium ${type === 'indoor' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                  onClick={() => setType('indoor')}
                >
                  Indoor
                </button>
                <button
                  type="button"
                  className={`flex-1 px-4 py-2 text-sm font-medium ${type === 'outdoor' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                  onClick={() => setType('outdoor')}
                >
                  Outdoor
                </button>
              </div>
            </div>
          </div>
          {/* Disabled Block and Place */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Block
              </label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 bg-gray-100"
                value={blockValue}
                disabled
                placeholder="Block"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Place
              </label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 bg-gray-100"
                value={placeValue}
                disabled
                placeholder="Place"
              />
            </div>
          </div>
          {/* Category Rows */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category & Remarks
            </label>
            {categories.map((cat, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 border rounded-lg p-2"
                  placeholder="Category"
                  value={cat.category}
                  onChange={e => handleCategoryChange(idx, 'category', e.target.value)}
                />
                <input
                  type="text"
                  className="flex-1 border rounded-lg p-2"
                  placeholder="Remarks"
                  value={cat.remarks}
                  onChange={e => handleCategoryChange(idx, 'remarks', e.target.value)}
                />
                {categories.length > 1 && (
                  <button
                    type="button"
                    className="px-2 py-1 bg-red-500 text-white rounded"
                    onClick={() => handleRemoveCategory(idx)}
                  >
                    X
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={handleAddCategory}
            >
              Add 
            </button>
          </div>
          {/* Submit */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg border border-green-700 transition-colors sm:min-w-[120px]"
            >
              Submit
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
        <ValidationPopup
          isOpen={showValidationPopup}
          onClose={() => setShowValidationPopup(false)}
          errors={validationErrors}
          title="Required Fields Missing"
          confirmButtonText="OK"
          confirmButtonColor="green"
        />
      </>
    );
  }

  // You can add your report view here if needed
  return null;
}