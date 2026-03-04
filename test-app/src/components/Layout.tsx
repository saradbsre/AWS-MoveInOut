import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDarkMode } from '@/hooks/useDarkMode';
import axios from 'axios';
import logo1 from '../assets/headerlogo.jpeg';
import { ValidateSession } from '@/services/Authentication/Loginapi';
import { getRoleGroup } from '@/utils/getRoleGroup';

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes
// const ACTIVITY_CHECK_THRESHOLD = 10 * 60 * 1000; // 10 minutes

// Interface for module structure
interface Module {
  name: string;
  path: string;
  accessKey: string;
  permissions?: {
    access: boolean;
    add: boolean;
    delete: boolean;
    modify: boolean;
    print: boolean;
  };
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const lastActivityRef = useRef(Date.now());
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);

  // Get modules from sessionStorage instead of hardcoded array
  const storedModules = sessionStorage.getItem('userModules');
  const modules: Module[] = storedModules ? JSON.parse(storedModules) : [];
  const rawRole = sessionStorage.getItem('role') || '' ;
  const roleid = getRoleGroup(rawRole) || '';



  // const username = sessionStorage.getItem('username') || 'User';

  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // const allowedModuleNames = [
  // "Dashboard",
  // "Move &In Register",
  // "Tenant Status Report"
  // // Add more as you create them in the cloud
  // ];

   const allowedModuleNames =
    roleid === 'branch'
      ? [
          "Dashboard",
          "&Dashboard",
          "Move &Out Register",
          "&Complaint Register",
          "Pending Complaints Register",
        ]
      : [
          "Dashboard",
          "Move &In Register",
          "Move in/Out Report",
          "Estimation Cost",
          "Estimation Cost Report",
          // "Pending Complaints Register",
          // "Complaint Category" 
          
          // Add more as you create them in the cloud
        ];

  function filterCloudModules(modules: Module[]): Module[] {
  return modules.filter(mod => allowedModuleNames.includes(mod.name));
  }
  

  const uniqueModules = modules.filter(
    (mod, idx, arr) => arr.findIndex(m => m.path === mod.path) === idx
    );

  const filteredModules = filterCloudModules(uniqueModules).sort((a, b) => {
    const indexA = allowedModuleNames.indexOf(a.name);
    const indexB = allowedModuleNames.indexOf(b.name);
    return indexA - indexB;
  });

  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  const handleLogout = useCallback(async () => {
    // const username = sessionStorage.getItem('username');
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/logout`,
        // { username }, // send username as fallback
        { withCredentials: true }
      );
      sessionStorage.clear();
      navigate('/', { replace: true });
    } catch {
      sessionStorage.clear();
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
  // Check session validity every 5 minutes
  const sessionCheckInterval = setInterval(async () => {
    try {
      const response = await ValidateSession();
      
      if (!response.success) {
        // Session is invalid on server - force logout
        handleLogout();
      }
    } catch {
      // Session validation failed - likely expired
      handleLogout();
    }
  }, 5 * 60 * 1000);
  
  return () => clearInterval(sessionCheckInterval);
}, [handleLogout]);



  // Send keep-alive to extend server session
const sendKeepAlive = useCallback(async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/keep-alive`, {
      withCredentials: true,
      timeout: 5000
    });
    
    // Update expiration time if server sends it
    if (response.data?.expiresAt) {
      setSessionExpiresAt(new Date(response.data.expiresAt));
    }
  } catch (error) {
    // If response is 401 Unauthorized, log out automatically
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      console.log('Session expired, logging out...');
      handleLogout();
    }
    // For other errors, we can still allow the user to continue
    // as it might just be a temporary network issue
  }
}, [handleLogout]);

  // Reset frontend timer and conditionally reset backend timer
  const handleActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    // Clear existing frontend timer
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    // Set new 15-minute frontend timer
    inactivityTimeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_LIMIT);

    // Always send keep-alive to backend on any activity
    sendKeepAlive();
  }, [handleLogout, sendKeepAlive]);

  // Activity tracking with throttling
  useEffect(() => {
    let throttleTimer: NodeJS.Timeout | undefined;
    
    const throttledHandleActivity = () => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        handleActivity();
        throttleTimer = undefined;
      }, 10000); 
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, throttledHandleActivity, { passive: true });
    });

    // Initialize on component mount
    handleActivity();

    // Cleanup
    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
      
      events.forEach(event => {
        window.removeEventListener(event, throttledHandleActivity);
      });
    };
  }, [handleActivity]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent scrolling when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // ... rest of your existing JSX stays exactly the same
  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-2 py-2 sm:px-3 sm:py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                type="button"
                className="inline-flex items-center p-2 text-xl text-gray-500 rounded-lg xl:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                aria-label="Open sidebar"
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <a className="flex ms-2 items-center min-w-0 flex-1">
                <img src={logo1} className="h-8 me-2 flex-shrink-0" alt="Logo" />
                <span
                  className="text-xs xs:text-sm sm:text-base md:text-xl font-semibold dark:text-white break-words"
                  style={{ maxWidth: '100%' }}
                  title="ABDULWAHED AHMAD RASHED BIN SHABIB"
                >
                  ABDULWAHED AHMAD RASHED BIN SHABIB
                </span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                  aria-label="User menu"
                >
                  <img
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    src="https://ui-avatars.com/api/?background=000000&color=ffffff&name=+"
                    alt="user"
                  />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600 z-50">
                     <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-600 text-sm font-medium text-gray-900 dark:text-gray-200">
                    User: {sessionStorage.getItem('username') || 'User'}
                  </div>
                    <ul className="py-1 text-sm text-gray-700 dark:text-gray-200">
                      <li>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          Logout
                        </button>
                      </li>
                    </ul>
                    
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-40 "
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 w-64 h-screen pt-20 transition-transform duration-300 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0 sm:z-40`}
        aria-label="Sidebar"
      >
        <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
          <ul className="space-y-2 font-medium">
              {filteredModules.map(({ name, path }) => (
                <li key={path}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded-lg group ${
                      isActive
                        ? 'bg-gray-100 text-blue-600 dark:bg-gray-700 dark:text-white'
                        : 'text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700'
                    }`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <svg
                    className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16z" />
                  </svg>
                  {/* <span className="ms-3">{name === "Move &In Register" ? "Move In/Out" : name}</span> */}
                  <span className="ms-3">
                     {name === "Move &In Register"
                   ? "Move In/Out"
                   : name === "&Complaint Register"
                   ? "Complaint Form"
                   : name === "&Dashboard"
                   ? "Dashboard"
                   : name === "&Tenant Master Maintenance"
                   ? "Complaint Report"
                   : name}
                  </span>
                  
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <div className="p-2 pt-20 xl:ml-64 bg-white dark:bg-gray-800">
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
          <Outlet />
        </div>
      </div>
    </>
  );
}