import axios from 'axios';
const apiUrl = import.meta.env.VITE_API_URL;

interface LoginCredentials {
  username: string;
  password: string;
}

export const ValidateSession = async () => {
  try {
    const response = await axios.get(`${apiUrl}/api/auth/validateSession`, {
      withCredentials: true,  
    });
    return response.data;
  } catch {
    return { success: false };
  }
};

export const login = async (credentials: LoginCredentials) => {
  try {
    const response = await axios.post(
      `${apiUrl}/api/auth/login`,
      credentials,
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};