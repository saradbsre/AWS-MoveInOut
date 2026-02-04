import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface DefaultRedirectProps {
  children: React.ReactNode;
}

export default function DefaultRedirect({ children }: DefaultRedirectProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if we're on the dashboard route
    if (location.pathname === 'dashboard') {
      // Get user's default module from sessionStorage
      const userModules = sessionStorage.getItem('userModules');     
      if (userModules) {
        try {
          const modules = JSON.parse(userModules);        
          // Find the default module or use the first available module
          const defaultModule = modules.length > 0 ? modules[0] : null;
          
          if (defaultModule && defaultModule.path) {
            navigate(defaultModule.path, { replace: true });
          }
        } catch (error) {
          console.error('Error parsing user modules:', error);
        }
      }
    }
  }, [navigate, location.pathname]);
  return <>{children}</>;
}