import React, { useEffect, useState } from 'react';
import { GetAuthTransitions } from '../../services/Transaction/Estimation/Authorizationapi';
import { insertComplaint, editComplaint, deleteComplaint } from '../../services/Transaction/Contract/Contractapi';

interface ComplaintAuthButtonsProps {
  currentAuthLevel: number;
  currentAuthStatus: string;
  complaintId: string | number;
  onAuthAction: (action: string, nextLevel: number, nextStatus: string) => void;
  onBack?: () => void;
  showBack?: boolean;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
}

interface WorkflowTransition {
  _id: string;
  module: string;
  fromStatus: string;
  action: string;
  toStatus: string;
  currentLevel: number;
  nextLevel: number;
  allowedRoles: string;
}

export default function ComplaintAuthButtons({
  currentAuthLevel,
  currentAuthStatus,
  complaintId,
  onAuthAction,
  onBack,
  showBack = true,
  loading = false,
  setLoading = () => {},
}: ComplaintAuthButtonsProps) {
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [availableActions, setAvailableActions] = useState<WorkflowTransition[]>([]);
  const userRole = sessionStorage.getItem('role') || '';

  // Fetch workflow transitions on mount
  useEffect(() => {
    const fetchTransitions = async () => {
      setLoading(true);
      const result = await GetAuthTransitions('Complaint');
      if (result.success) {
        setTransitions(result.transitions);
      }
      setLoading(false);
    };
    fetchTransitions();
  }, []);

  // Determine available actions based on current level and user role
  useEffect(() => {
    if (transitions.length === 0) return;
    const actions = transitions.filter((t) => {
      const isCurrentLevel = t.currentLevel === currentAuthLevel;
      const hasAccess =
        !t.allowedRoles ||
        t.allowedRoles.trim() === '' ||
        t.allowedRoles.toUpperCase() === userRole.toUpperCase();
      return isCurrentLevel && hasAccess;
    });
    setAvailableActions(actions);
  }, [transitions, currentAuthLevel, userRole]);

  const isRejectedState = currentAuthStatus?.toLowerCase().includes('reject');
  const isFinalState =
    transitions.length > 0 &&
    !transitions.some((t) => t.currentLevel === currentAuthLevel) &&
    !isRejectedState;

  const handleAction = async (transition: WorkflowTransition) => {
    await executeAction(transition, '');
  };

  const executeAction = async (transition: WorkflowTransition, remarks: string) => {
    setLoading(true);
    try {
      const actionType = transition.action.toLowerCase();

      let result;
      if (actionType === 'submit') {
        // You may need to pass more fields for insertComplaint
        result = await insertComplaint({
          complaint_id: complaintId as string,
          complaintNum: '', // Fill as needed
          build_id: '',     // Fill as needed
          build_desc: '',   // Fill as needed
          unit_desc: '',    // Fill as needed
          status: transition.toStatus,
          Date: new Date().toISOString(),
        });
      } else if (actionType === 'cancel') {
        result = await deleteComplaint(complaintId as string);
      }

      if (result.success) {
        onAuthAction(actionType, transition.nextLevel, transition.toStatus);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Failed to update complaint');
    } finally {
      setLoading(false);
    }
  };

  const getButtonColor = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (actionUpper === 'REJECT') {
      return 'hover:bg-red-500 dark:hover:bg-red-700';
    } else if (actionUpper === 'APPROVE') {
      return 'hover:bg-green-700 dark:hover:bg-green-700';
    } else if (actionUpper === 'SUBMIT') {
      return 'hover:bg-green-700 dark:hover:bg-green-700';
    } else if (actionUpper === 'CANCEL') {
      return 'hover:bg-red-500 dark:hover:bg-red-700';
    }
    return 'hover:bg-gray-500 dark:hover:bg-gray-700';
  };

  return (
    <div className="flex gap-2">
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-blue-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-blue-700 dark:border-gray-600 transition-colors"
        >
          BACK
        </button>
      )}

      {!isFinalState &&
        availableActions.map((transition, idx) => (
          <button
            key={transition._id || `${transition.action}-${transition.nextLevel}-${idx}`}
            type="button"
            onClick={() => handleAction(transition)}
            disabled={loading}
            className={`flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getButtonColor(transition.action)}`}
          >
            {loading ? 'Processing...' : transition.action}
          </button>
        ))}
    </div>
  );
}