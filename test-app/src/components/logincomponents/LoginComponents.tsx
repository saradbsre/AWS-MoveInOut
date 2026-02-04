import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ValidateSession } from '@/services/Authentication/Loginapi';

export default function LoginComponents(){
    const apiUrl = import.meta.env.VITE_API_URL;
    const [isLoading, setIsLoading] = useState(true); // Session check loading
    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            try {
            const response = await ValidateSession();
            if (response.success) {
                console.log('Valid Session Redirected to Default Module')
                sessionStorage.setItem('userModules', JSON.stringify(response.user.modules));
                sessionStorage.setItem('username', response.user.username);
                sessionStorage.setItem('role', response.user.role);
                sessionStorage.setItem('defaultModule', response.user.DefaultMod || 'dashboard');
                const defaultRoute = sessionStorage.getItem('defaultModule');
                console.log('Default Route:', defaultRoute);
                navigate(`/${defaultRoute}`, { replace: true });
                return;
            }
            } catch {
            // Session invalid, continue to login form
            console.log('Invalid Session, continue to login form')
            } finally {
            setIsLoading(false);
            }
        };

        checkSession();
        }, [navigate, apiUrl]);

        return null
    }