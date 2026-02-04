import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '@/hooks/useDarkMode';
import logo1 from '@/assets/headerlogo.jpeg';
import LoginComponents from '@/components/logincomponents/LoginComponents';
import { login } from '@/services/Authentication/Loginapi';
const apiUrl = import.meta.env.VITE_API_URL;

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Login process loading
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();

  // useEffect(() => {
  //   const initializeConnection = async () => {
  //     const domain = 'portal.bsre.abdulwahedbinshabibproperty.com';
      
  //     try {
  //       await axios.post(`${apiUrl}/api/auth/initializeCompany`, {
  //          domain 
  //         }, { withCredentials: true });
  //     } catch (err) {
  //       console.error('Failed to initialize company connection:', err);
  //       setError('Unable to connect to company database. Please try again.');
  //     }
  //   };
  //   initializeConnection();
  // }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);

    if (!username || !password) {
      setError('Please enter both username and password.');
      setIsLoggingIn(false);
      return;
    }

    try {
      const domain = 'portal.bsre.abdulwahedbinshabibproperty.com';
      await axios.post(`${apiUrl}/api/auth/initializeCompany`, { domain }, { withCredentials: true });
      const res = await login({ username, password });
        // console.log('Login response headers:', res.headers);

      if (res.success) {
        // Store user data in sessionStorage
        sessionStorage.setItem('username', res.username);
        sessionStorage.setItem('role', res.role);
        sessionStorage.setItem('userAccess', JSON.stringify(res.access));
        sessionStorage.setItem('userModules', JSON.stringify(res.modules));
        sessionStorage.setItem('defaultModule', res.DefaultMod || 'dashboard');
        if (res.tenantName) {
          sessionStorage.setItem('tenantName', res.tenantName);
        }
        if (res.contracts) {
          sessionStorage.setItem('tenantContracts', JSON.stringify(res.contracts));
        }

        if (res.role === 'TECHNICIAN') {
          navigate('Dashboard', { replace: true });
        } else {
          const defaultRoute = res.DefaultMod || 'dashboard';
          navigate(defaultRoute, { replace: true });
        }
        // Don't set isLoggingIn to false here - navigation will handle cleanup
      } else {
        // Handle specific error messages from server
        const errorMessage = res.message || 'Invalid username or password';
        setError(errorMessage);
        setIsLoggingIn(false);
      }
    } catch (error: any) {
      // Handle network errors and server errors
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      setIsLoggingIn(false);
    }
  };

  return (
    
    <section className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-8">
    <LoginComponents />

      <div className="
        w-full
        bg-white dark:bg-gray-800
        rounded-xl shadow-lg
        p-6 sm:p-8 md:p-10
        max-w-xs sm:max-w-md md:max-w-lg lg:max-w-l
        transition-all
      ">
        {/* Logo + Title */}
        <div className="text-center mb-6">
          {/* <img src={logo} alt="Company Logo" className="mx-auto mb-4 w-80 h-80 sm:w-80 sm:h-80" /> */}
          <img src={logo1} alt="Company Logo" className="mx-auto mb-4 w-80 h-140 sm:w-80 sm:h-80" />
          {/* <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-semibold tracking-wide uppercase">Welcome to</p>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">ABDULWAHED AHMAD RASHED</h1>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">BIN SHABIB</h2> */}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-sm text-center font-semibold mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={isLoggingIn}
            className="w-full p-3 rounded-md border border-gray-300 bg-gray-50 text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-orange-600
                       dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={isLoggingIn}
            className="w-full p-3 rounded-md border border-gray-300 bg-gray-50 text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-orange-600
                       dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            required
          />
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-md
                       focus:outline-none focus:ring-4 focus:ring-orange-300 dark:focus:ring-orange-800
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                       flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </section>
  );
}