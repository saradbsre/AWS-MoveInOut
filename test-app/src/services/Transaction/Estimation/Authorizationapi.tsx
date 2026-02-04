const apiUrl = import.meta.env.VITE_API_URL;
import axios from "axios";

export const GetAuthTransitions = async (module: string) => {
  try {
    const response = await axios.get(`${apiUrl}/api/auth-transitions?module=${encodeURIComponent(module)}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const UpdateEstimationAuth = async (
  srno: number | null | undefined, 
  action: string, 
  nextLevel: number, 
  nextStatus: string,
  rejectionRemarks?: string
) => {
  try {
    const response = await axios.post(
      `${apiUrl}/api/update-estimationcost`,
      { 
        srno, 
        action, 
        nextLevel, 
        nextStatus,
        rejectionRemarks: rejectionRemarks || '' 
      },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating estimation authorization:', error);
    return { success: false, error: 'Failed to update authorization' };
  }
};