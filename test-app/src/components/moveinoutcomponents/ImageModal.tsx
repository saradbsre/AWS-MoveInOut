import React from 'react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: File[];
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  existingImages?: { url: string }[];
}

export default function ImageModal({ 
  isOpen, 
  onClose, 
  images, 
  onImageSelect, 
  onRemoveImage,
  existingImages  
}: ImageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attach Images</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Click to select images</p>
              {/* <p className="text-xs text-gray-500 dark:text-gray-500">Minimum 5 images required</p> */}
            </label>
          </div>

          {/* Image Preview Grid */}
       
{(existingImages?.length || 0) + images.length > 0 && (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
    {/* Existing images (from server/complaint) */}
    {existingImages?.map((img, index) => (
      <div key={`existing-${index}`} className="relative">
        <img
          src={img.url}
          alt={`Existing ${index + 1}`}
          className="w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
        />
        {/* Optionally, add a remove button for existing images if you want */}
      </div>
    ))}
    {/* Newly selected images */}
    {images.map((image, index) => (
      <div key={`new-${index}`} className="relative">
        <img
          src={URL.createObjectURL(image)}
          alt={`Preview ${index + 1}`}
          className="w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
        />
        <button
          onClick={() => onRemoveImage(index)}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
        >
          ×
        </button>
      </div>
    ))}
  </div>
)}


          {/* Add More Button */}
          {images.length > 0 && images.length < 10 && (
            <button
              onClick={() => document.getElementById('image-upload')?.click()}
              className="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              + Add More Images
            </button>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                  onClose();
              }}
              // disabled={images.length < 5}
              className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Attach {images.length} Images
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}