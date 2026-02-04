import React from 'react';

interface PageLoaderProps {
  message?: string;
  progressText?: string;
  progressValue?: number;
}

const PageLoader: React.FC<PageLoaderProps> = ({ 
  message = "Loading...", 
  progressText = "Compiling UI and Data...",
  progressValue = 70
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl dark:shadow-2xl border border-gray-200 dark:border-gray-700">
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
        </div>
        
        {/* Progress bar effect */}
        <div className="mt-6 w-48 mx-auto">
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-orange-400 to-orange-600 dark:from-orange-300 dark:to-orange-500 h-full rounded-full animate-pulse transition-all duration-1000 ease-in-out" 
              style={{ width: `${progressValue}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 animate-pulse">
            {progressText}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;