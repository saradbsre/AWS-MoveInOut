import React from 'react';
import { Navigate } from 'react-router-dom';

interface UserModule {
  name: string;
  path: string;
  accessKey: string;
  permissions: {
    access: boolean;
    add: boolean;
    delete: boolean;
    modify: boolean;
    print: boolean;
  };
}

interface ProtectedModuleProps {
  modulePath: string;
  children: React.ReactNode;
}

export default function ProtectedModule({ modulePath, children }: ProtectedModuleProps) {
  // Get user modules from sessionStorage
  const storedModules = sessionStorage.getItem('userModules');
  const userModules: UserModule[] = storedModules ? JSON.parse(storedModules) : [];

  // Check if user has access to this module (path match and permissions.access is YES/true)
  const hasAccess = userModules.some((module: any) => {
    const pathMatch =
      module.path === modulePath ||
      module.path === `/${modulePath}` ||
      `/${module.path}` === modulePath;
    const accessPerm =
      module.permissions &&
      (module.permissions.access === true || module.permissions.access === 'YES');
    return pathMatch && accessPerm;
  });

  if (!hasAccess) {
    // Get user's default module from sessionStorage or use first available module
    const defaultModule = sessionStorage.getItem('defaultModule');
    
    // If we have a default module, use it
    if (defaultModule) {
      return <Navigate to={`/${defaultModule}`} replace />;
    }
    
    // Otherwise, redirect to the first module the user has access to
    if (userModules.length > 0) {
      const firstModule = userModules[0];
      const redirectPath = firstModule.path.startsWith('/') ? firstModule.path : `/${firstModule.path}`;
      return <Navigate to={redirectPath} replace />;
    }
    
    // Fallback to dashboard if no modules available
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}