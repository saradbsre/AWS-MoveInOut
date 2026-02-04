import React, { useEffect, useState } from 'react';
import { UpdateEstimationAuth, GetAuthTransitions } from '../../services/Transaction/Estimation/Authorizationapi';
import { SaveEstimationCost } from '../../services/Transaction/Estimation/Estimationapi';
import RejectionModal from '@/components/estimationcostcomponents/EstimationCostRejectionModal';

interface EstimationAuthButtonsProps {
  currentAuthLevel: number;
  currentAuthStatus: string;
  srno: number | null | undefined;
  onAuthAction: (action: string, nextLevel: number, nextStatus: string) => void;
  onBack?: () => void;
  showBack?: boolean;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
  hasValidData?: boolean;
  equipment: any[];
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

export default function EstimationAuthButtons({
  currentAuthLevel,
  currentAuthStatus,
  srno,
  onAuthAction,
  onBack,
  showBack = true,
  loading = false,
  setLoading = () => {},
  hasValidData = false ,
  equipment
}: EstimationAuthButtonsProps) {
  
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [availableActions, setAvailableActions] = useState<WorkflowTransition[]>([]);
  const userRole = sessionStorage.getItem('role') || '';
  
  // Modal state for rejection
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingRejection, setPendingRejection] = useState<WorkflowTransition | null>(null);
  // Fetch workflow transitions on mount
  useEffect(() => {
    const fetchTransitions = async () => {
      setLoading(true);
      const result = await GetAuthTransitions('Estimation Cost');
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
    const hasAccess = !t.allowedRoles || 
      t.allowedRoles.trim() === '' ||
      t.allowedRoles.toUpperCase() === userRole.toUpperCase();
    return isCurrentLevel && hasAccess;
  });

    setAvailableActions(actions);
  }, [transitions, currentAuthLevel, userRole]);

  const isNewEstimation = !srno;
  
  // If there are no transitions FROM the current level, it's a final state
  const isRejectedState = currentAuthStatus?.toLowerCase().includes('reject');
  const isFinalState = transitions.length > 0 && 
                      !transitions.some(t => t.currentLevel === currentAuthLevel) &&
                      !isRejectedState;

  const handleAction = async (transition: WorkflowTransition) => {
    const isRejectAction = transition.action.toLowerCase().includes('reject');
    
    // If it's a reject action, show modal first
    if (isRejectAction) {
      setPendingRejection(transition);
      setShowRejectModal(true);
      return;
    }
    
    // For non-reject actions, proceed directly
    await executeAction(transition, '');
  };

  const executeAction = async (transition: WorkflowTransition, remarks: string) => {
    setLoading(true);
    try {
      const actionType = transition.action.toLowerCase().includes('reject') ? 'reject' : transition.action.toLowerCase();

    if (actionType === 'verify') {
      // Save the updated equipment and header before verifying
      const saveResult = await SaveEstimationCost({
        equipment,
        srno
      });
      if (!saveResult.success) {
        alert('Failed to save updated amounts before verifying.');
        setLoading(false);
        return;
      }
    }
      
      const result = await UpdateEstimationAuth(
        srno, 
        actionType,   
        transition.nextLevel, 
        transition.toStatus,
        remarks
      );
      if (result.success) {
        onAuthAction(actionType, transition.nextLevel, transition.toStatus);
      } else {
        console.error('Error:', result.error);
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating authorization:', error);
      alert('Failed to update authorization');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectConfirm = async (remarks: string) => {
    if (pendingRejection) {
      await executeAction(pendingRejection, remarks);
      setShowRejectModal(false);
      setPendingRejection(null);
    }
  };

  const handleRejectCancel = () => {
    setShowRejectModal(false);
    setPendingRejection(null);
  };

  const handlePrint = () => {
    const printWindow = window.open(`/EstimationCostReportView/${srno}`, '_blank', 'width=1024,height=768');
    
    if (printWindow) {
      // Listen for message from child window when it's ready
      const messageHandler = (event: MessageEvent) => {
        if (event.data === 'READY_TO_PRINT') {
          setTimeout(() => {
            printWindow.print();
          }, 300);
          window.removeEventListener('message', messageHandler);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Cleanup: Remove listener after 5 seconds if no message received
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
      }, 5000);
    }
  };

  const getButtonColor = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (actionUpper === 'REJECT') {
      return 'hover:bg-red-500 dark:hover:bg-red-700';
    } else if (actionUpper === 'VERIFY') {
      return 'hover:bg-green-700 dark:hover:bg-green-700';
    } else if (actionUpper === 'APPROVE') {
      return 'hover:bg-green-700 dark:hover:bg-green-700';
    } else if (actionUpper === 'SUBMIT') {
      return 'hover:bg-green-700 dark:hover:bg-green-700';
    }
    return 'hover:bg-gray-500 dark:hover:bg-gray-700';
  };

  return (
    <>
      <RejectionModal
        isOpen={showRejectModal}
        onConfirm={handleRejectConfirm}
        onCancel={handleRejectCancel}
      />

      <div className="flex gap-2">
        {/* Always show BACK button if showBack is true */}
        {showBack && (
          <button 
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-blue-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-blue-700 dark:border-gray-600 transition-colors"
          >
            BACK
          </button>
        )}

        {/* For final state (approved/completed), show print button */}
        {isFinalState && !isNewEstimation && (
          <button 
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-purple-700 dark:border-gray-600 transition-colors"
          >
            PRINT
          </button>
        )}

        {/* For new estimations, show save button only if there's valid data */}
        {isNewEstimation && hasValidData && (
          <button 
            type="submit"
            form="estimation-cost-form"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-green-700 text-black font-medium rounded-lg border border-grey-300 dark:text-white dark:bg-gray-700 dark:hover:bg-green-700 dark:border-gray-600 transition-colors"
          >
            SAVE
          </button>
        )}

        {/* For workflow states with available actions, show dynamic buttons */}
        {!isNewEstimation && !isFinalState && availableActions.map((transition, idx) => (
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
    </>
  );
}