const apiUrl = import.meta.env.VITE_API_URL;
import axios from "axios";

interface ChecklistPayload {
  contract: string;
  username: string;
  tenantCode: string;
  tenantName: string;
  building: string;
  unit: string;
  visitType: string;
  equipment: string;
  tenantsignature: string;
  techniciansignature: string;
  date: string | Date;
  startDate?: string | null;
  endDate?: string | null;
  barcode?: string;
  images?: File[];
  videos?: File[];
  refNum?: string;
}

// Fetch buildings
export const getBuildings = async () => {
  try{
  const response = await axios.get(`${apiUrl}/api/contract/buildings`, 
  { withCredentials: true });
  return response.data;
  }catch(error: any){
  return { success: false, error: error.message };
  }
};
// Fetch units
export const getUnits = async (buildingId: string) => {
  try {
    const response = await axios.get(`${apiUrl}/api/contract/units`, {
    params: { buildingId },
    withCredentials: true
    });
    return response.data;
  }catch(error: any){
    return { success: false, error: error.message };
  }
};
// Automatically fet tenant info
export const getTenantInfo = async (buildingId: string, unitId: string) => {
  try{
    const response = await axios.get(`${apiUrl}/api/contract/tenant`,{
      params: { buildingId, unitId },
      withCredentials: true
    });
    return response.data;
  }catch(error: any){
    return { success: false, error: error.message };
  }
};

export const getEquipment = async () => {
  try {
  const response = await axios.get(`${apiUrl}/api/contract/equipments`,
  { withCredentials: true }
  );
  // console.log(response.data);
  return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const saveChecklist = async (data: ChecklistPayload) => {
  try{
  const formData = new FormData();
  formData.append('contract', data.contract);
  formData.append('visitType', data.visitType);
  formData.append('equipment', data.equipment);
  formData.append('tenantsignature', data.tenantsignature);
  formData.append('techniciansignature', data.techniciansignature);
  formData.append('username', data.username ?? '');
  formData.append('tenantCode', data.tenantCode ?? '');
  formData.append('tenantName', data.tenantName ?? '');
  formData.append('building', data.building ?? '');
  formData.append('unit', data.unit ?? '');
  formData.append('date', typeof data.date === 'string' ? data.date : data.date.toISOString());
  formData.append('startDate', data.startDate ?? '');
  formData.append('endDate', data.endDate ?? '');
  formData.append('barcode', data.barcode ?? '');
  formData.append('refNum', data.refNum ?? ''); 
  if (data.images) data.images.forEach(file => formData.append('images', file));
  if (data.videos) data.videos.forEach(file => formData.append('videos', file));
  // for (let [key, value] of formData.entries()) {
  //     console.log(key, value);
  // }
  const result = await axios.post(`${apiUrl}/api/contract/insertchecklist`, formData, {
    withCredentials: true,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
    if (result.data.success) {
    console.log('Checklist saved successfully');
    }else{
    console.error('Error saving checklist:', result.data.error);
    }
  return result.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};