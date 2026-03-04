import React from "react";

export function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="px-3 py-1 bg-white text-black rounded mr-2 hover:bg-green-700 transition border border-black-700"
      onClick={onClick}
      type="button"
    >
      Add
    </button>
  );
}

export function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="px-3 py-1 bg-white text-black rounded mr-2 hover:bg-yellow-600 transition border border-black-700"
      onClick={onClick}
      type="button"
    >
      Edit
    </button>
  );
}

export function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="px-3 py-1 bg-white text-black rounded hover:bg-red-700 transition border border-black-700"
      onClick={onClick}
      type="button"
    >
      Delete
    </button>
  );
}

export function SaveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="px-3 py-1 bg-white text-black rounded hover:bg-blue-700 transition border border-black-700"
      onClick={onClick}
      type="button"
    >
      Save
    </button>
  );
}

export function BranchActionButton({
  isUpdate,
  onClick,
  disabled,
}: {
  isUpdate: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {


  return (
    <button
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium border border-grey-300 transition-colors
        ${disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-white text-black hover:bg-green-700"
        }`}
      onClick={onClick}
      type="button"
      disabled={disabled}
    >
      {isUpdate ? "Update" : "Submit"}
    </button>
  );
}

export function AdminActionButton({
  action,
  onClick,
  disabled,
}: {
  action: "submit" | "next" | "assign" | "reassign";
  onClick: () => void;
  disabled?: boolean;
}) {
  const labelMap: Record<typeof action, string> = {
    submit: "Submit",
    next: "Next",
    assign: "Assign",
    reassign: "Reassign",
  };
  return (
    <button
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium border border-grey-300 transition-colors
        ${disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-white text-black hover:bg-green-700"
        }`}
      onClick={onClick}
      type="button"
      disabled={disabled}
    >
      {labelMap[action]}
    </button>
  );
}

export function ApproveButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium border border-grey-300 transition-colors
        ${disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-white text-black hover:bg-blue-700"
        }`}
      onClick={onClick}
      type="button"
      disabled={disabled}
    >
      Approve
    </button>
  );
}

export function CancelButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium border border-grey-300 transition-colors
        ${disabled
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-white text-black hover:bg-red-700"
        }`}
      onClick={onClick}
      type="button"
      disabled={disabled}
    >
      Cancel
    </button>
  );
}