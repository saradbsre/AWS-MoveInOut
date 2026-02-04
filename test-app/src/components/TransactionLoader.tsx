import React from 'react';

interface TransactionLoaderProps {
  message?: string;
  progressText?: string;
}

const TransactionLoader: React.FC<TransactionLoaderProps> = ({ 
  message = "Processing...", 
  progressText = "Please wait..."
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="text-center p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Main spinner */}
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-600 border-t-orange-500 dark:border-t-orange-400 mx-auto"></div>
          {/* Inner pulse effect */}
          <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-orange-300 dark:border-t-orange-500 animate-ping mx-auto opacity-40 dark:opacity-30"></div>
        </div>
        
        {/* Loading text with fade animation */}
        <div className="mt-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 animate-pulse">
            {message}
          </h3>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            {progressText}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionLoader;
