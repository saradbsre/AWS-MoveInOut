const apiUrl = import.meta.env.VITE_API_URL;
import axios from "axios";

export const GetChecklistForEstimation = async () => {
  try {
    const response = await axios.get(`${apiUrl}/api/checklistestimation/checklistforestimation`,
    { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const fetchItemPrice = async (itemno: string) => {
  try {
    const response = await axios.get(`${apiUrl}/api/estimationcost/fetchItemPrice`, 
      { params: { itemno }, 
      withCredentials: true });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const SaveEstimationCost = async (data: { equipment: any[], srno: number | null | undefined }) => {
  try {
    const response = await axios.post(`${apiUrl}/api/estimationcost/saveEstimationCost`, 
    data, 
    { withCredentials: true });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};  