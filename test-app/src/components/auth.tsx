import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useDarkMode } from '@/hooks/useDarkMode'; // Add this import
import PageLoader from '@/components/PageLoader';
import { ValidateSession } from '@/services/Authentication/Loginapi';

type AuthProps = {
  children: React.ReactNode;
};

const Auth = ({ children }: AuthProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useDarkMode();

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await ValidateSession();
        if (response.success) {
          setIsAuthenticated(true);
          // console.log('Authentication True');
          // Store user data in sessionStorage for component access
          sessionStorage.setItem('userModules', JSON.stringify(response.user.modules));
          sessionStorage.setItem('username', response.user.username);
          sessionStorage.setItem('role', response.user.role);
        } else {
          setIsAuthenticated(false);
          console.log('Authentication False');
        }
      } catch (error: any){
        setIsAuthenticated(false);
        console.log('Authentication Has error so Defaulted to False');
        // console.log(error);
      }
    };

    validateSession();
  }, []);

  // Show loading while checking session
  if (isAuthenticated === null) {
  return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default Auth;