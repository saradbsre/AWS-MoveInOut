import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import LoginForm from '@/pages/login/LoginForm';
import UserCreation from '@/pages/UserCreation';
import Dashboard from '@/pages/Dashboard';
import Moveinout from '@/pages/moveinout/Moveinout';
import ChecklistHistory from '@/pages/checklist/ChecklistHistory';
import { DisableDevTools } from './hooks/DisableDevTools';
import RequireAuth from '@/components/auth';
import ProtectedModule from '@/components/ProtectedModule';
import ComplaintForm from '@/pages/tenant/ComplaintForm';
import TenantStatus from '@/pages/tenant/TenantStatus';
import TenantStatusReport from '@/pages/moveinout/technician/TenantReport';
import ChecklistReport from '@/pages/checklist/ChecklistReport';
import EstimationCost from '@/pages/maintenance/EstimationCost';
import EstimationReport from '@/pages/maintenance/EstimationCostReport';
import EstimationCostReportView from '@/pages/maintenance/EstimationCostReportView';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The page you're looking for doesn't exist or you don't have access to it.
        </p>
        <button
          onClick={() => window.location.href = 'dashboard'}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

function App() {
  const location = useLocation();
  DisableDevTools();
  return (
    <Routes>
      {/* Public login route */}
      <Route path="/" element={<LoginForm />} />

      {/* Protected routes inside Layout */}
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="Dashboard" element={<ProtectedModule modulePath="Dashboard"><Dashboard /></ProtectedModule>} />
        <Route path="Move &In Register" element={<ProtectedModule modulePath="Move &In Register"><Moveinout key={location.key} /></ProtectedModule>} />
        <Route
          path="Move in/Out Report"
          element={
            <ProtectedModule modulePath="Move in/Out Report">
              {
                (() => {
                  const roleid = sessionStorage.getItem('role')
                  // console.log('App roleid:', roleid);
                  if (roleid === 'TENANT') return <TenantStatus />;
                  if (roleid === 'TECHNICIAN') return <TenantStatusReport />;
                  if (roleid === 'System Administrator') return <ChecklistReport />;
                  return <NotFound />;
                })()
              }
            </ProtectedModule>
          }
        />
        <Route path="Estimation Cost" element={
          <ProtectedModule modulePath="Estimation Cost">
            <EstimationCost 
              EstimationCostData={null} 
              onNewChecklist={() => {}} 
              fromHistory={false} 
              key={location.key} 
            />
          </ProtectedModule>
        } />      
        <Route path="Estimation Cost Report" element={<ProtectedModule modulePath="Estimation Cost Report"><EstimationReport key={location.key} /></ProtectedModule>} />
        {/* Un Protected Routes */}
        <Route path="UserCreation" element={<UserCreation />} />
        <Route path="ChecklistHistory" element={<ChecklistHistory />} />
        <Route path="&Tenant Master Maintenance" element={<ComplaintForm />} />
        {/* <Route path="EstimationCost" element={<EstimationCost />} /> */}
        <Route path="EstimationCostReport" element={<EstimationReport />} />
        <Route path="EstimationCostReportView/:srno" element={<EstimationCostReportView />} />
        {/* Catch-all route for 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
