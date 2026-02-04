import React, { useState } from 'react';

interface RejectionModalProps {
  isOpen: boolean;
  onConfirm: (remarks: string) => void;
  onCancel: () => void;
}

export default function RejectionModal({ isOpen, onConfirm, onCancel }: RejectionModalProps) {
  const [rejectionRemarks, setRejectionRemarks] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!rejectionRemarks.trim()) {
      alert('Please enter rejection remarks');
      return;
    }
    onConfirm(rejectionRemarks);
    setRejectionRemarks(''); // Clear after confirm
  };

  const handleCancel = () => {
    setRejectionRemarks(''); // Clear on cancel
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Rejection Remarks</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Remarks <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rejectionRemarks}
            onChange={(e) => setRejectionRemarks(e.target.value)}
            placeholder="Please enter reason for rejection..."
            rows={4}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!rejectionRemarks.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
}