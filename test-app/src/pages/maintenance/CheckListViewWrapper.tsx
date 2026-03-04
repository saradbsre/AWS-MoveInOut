// In src/pages/maintenance/CheckListViewWrapper.tsx
import { useLocation } from 'react-router-dom';
import CheckListView from './CheckListView';

export default function CheckListViewWrapper() {
  const location = useLocation();
  const {
    Reference,
    reportData,
    onNewChecklist,
    barcodeValue,
    barcodeBase64,
    fromHistory,
    disableActions,
    fromViewType,
    onBack,
  } = location.state || {};

  return (
    <CheckListView
      Reference={Reference}
      reportData={reportData}
      onNewChecklist={onNewChecklist}
      barcodeValue={barcodeValue}
      barcodeBase64={barcodeBase64}
      fromHistory={fromHistory}
      disableActions={disableActions}
      fromViewType={fromViewType}
      onBack={onBack}
    />
  );
}