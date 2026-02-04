import React from 'react';

interface ValidationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  errors: string[];
  confirmButtonText?: string;
  confirmButtonColor?: 'red' | 'green' | 'blue' | 'orange';
}

export default function ValidationPopup({
  isOpen,
  onClose,
  title = "Required Fields Missing",
  message = "Please complete the following before proceeding:",
  errors,
  confirmButtonText = "OK",
  confirmButtonColor = "green"
}: ValidationPopupProps) {
  if (!isOpen) return null;

  const getButtonColorClasses = () => {
    switch (confirmButtonColor) {
      case 'red':
        return 'bg-red-600 hover:bg-red-700';
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'orange':
        return 'bg-orange-600 hover:bg-orange-700';
      case 'green':
      default:
        return 'bg-green-600 hover:bg-green-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-300 dark:border-gray-600">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {message}
          </p>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-600 dark:text-red-400">
                {error}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${getButtonColorClasses()} text-white font-medium rounded-lg transition-colors`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}