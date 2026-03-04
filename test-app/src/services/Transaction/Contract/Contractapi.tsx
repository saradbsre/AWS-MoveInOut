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
  subComp_id?: string | number;
}

export interface ComplaintPayload {
  complaint_id?: string;
  complaintNum: string;
  complaintType?: string;
  build_id: string;
  build_desc: string;
  unit_desc: string;
  block?: string;
  accessArea?: string;
  both?: string;
  CTenantName?: string;
  contract_id?: string;
  type?: string;
  description?: string;
  status: string;
  auditrev?: number;
  userid?: string;
  Date: string;
  assigned?: number;
}

// Fetch contracts
export const getContracts = async () => {
  try {
    const response = await axios.get(`${apiUrl}/api/contract/contracts`, { withCredentials: true });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

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
export const getUnits = async (buildingId: string, contractId?: string) => {
  try {
    const params: any = { buildingId };
    if (contractId) params.contractId = contractId;

    const response = await axios.get(`${apiUrl}/api/contract/units`, {
      params,
      withCredentials: true
    });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
// Automatically fet tenant info
export const getTenantInfo = async (
  buildingId?: string,
  unitId?: string,
  contractId?: string
) => {
  try {
    const params: any = {};
    if (buildingId) params.buildingId = buildingId;
    if (unitId) params.unitId = unitId;
    if (contractId) params.contractId = contractId;

    const response = await axios.get(`${apiUrl}/api/contract/tenant`, {
      params,
      withCredentials: true
    });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getTechnicians = async (build_id?: string, area_id?: string) => {
  try {
    const params: any = {};
    if (build_id) params.build_id = build_id;
    if (area_id) params.area_id = area_id;
    const response = await axios.get(`${apiUrl}/api/contract/technicians`, {
      params,
      withCredentials: true
    });
    return response.data;
  } catch (error: any) {
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
  formData.append('subComp_id', data.subComp_id ? data.subComp_id.toString() : '');
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

export const insertComplaint = async (data: ComplaintPayload & { images?: File[]; videos?: File[] }) => {
  try {
    const formData = new FormData();
    // Append all fields from data except images/videos
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'images' && key !== 'videos' && value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });
    // Append images
    if (data.images) {
      data.images.forEach(file => formData.append('images', file));
    }
    // Append videos
    if (data.videos) {
      data.videos.forEach(file => formData.append('videos', file));
    }

    const response = await axios.post(
      `${apiUrl}/api/contract/insertcomplaint`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const insertComplaintDetails = async (data: ComplaintPayload) => {
  try {
    // Use FormData only if you expect files, otherwise send JSON
    const response = await axios.post(
      `${apiUrl}/api/contract/insertcomplaintdetails`,
      data,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getComplaints = async () => {
  try {
    const response = await axios.get(
      `${apiUrl}/api/contract/getcomplaints`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getComplaintDetails = async (area_id?: string, build_id?: string) => {
  try {
    const params: any = {};
    if (area_id) params.area_id = area_id;
    if (build_id) params.build_id = build_id;
    const response = await axios.get(
      `${apiUrl}/api/contract/getcomplaintdetails`,
      {
        params,
        withCredentials: true
      }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateComplaintDetails = async (data: {
  complaint_id: string,
  subComp_id: number,
  status: string,
  assigned_to: string,
  assigned_by: string,
  assigned_date: string,
  auditrev: number
}) => {
  try {
    const response = await axios.post(
      `${apiUrl}/api/contract/updatecomplaintdetails`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}; 

export const editComplaint = async (data: {
  complaint_id: string,
  description: string,
  block: string,
  place: string,
  floor: string,
  username: string
}) => {
  try {    const response = await axios.post(
      `${apiUrl}/api/contract/editcomplaint`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteComplaint = async (complaint_id: string) => {
  try {
    const response = await axios.delete(
      `${apiUrl}/api/contract/deletecomplaint`,
      {
        data: { complaint_id },
        withCredentials: true
      }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteComplaintDetails = async (complaint_id: string, subComp_id: number) => {
  try {    const response = await axios.delete(
      `${apiUrl}/api/contract/deletecomplaintdetails`,
      { data: { complaint_id, subComp_id }, withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getComplaintCategories = async () => {
  try {
    const response = await axios.get(
      `${apiUrl}/api/contract/complaintcategories`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCategoryItems = async (sscode: string) => {
  try {
    const response = await axios.get(`${apiUrl}/api/contract/getcategoryitems`, {
      params: { sscode },
      withCredentials: true
    });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getUserLists = async (technician?: number | string | boolean) => {
  try {
    const params: any = {};
    if (technician !== undefined) params.technician = technician;
    const response = await axios.get(
      `${apiUrl}/api/contract/userlists`,
      { params, withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const addTechnicians = async (techs: { Uname: string }[]) => {
  try {   
     const response = await axios.post(`${apiUrl}/api/contract/addtechnicians`,
      { technicians: techs },
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const addCatTech = async (
  area_ids: string[],
  userid: string,
  technicians: { Uname: string }[],
  cat_id: string // <-- add this
) => {
  try {
    const response = await axios.post(
      `${apiUrl}/api/contract/addcattech`,
      {
        area_ids,
        userid,
        technicians,
        cat_id, // <-- add this
      },
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCatTechnicians = async (cat_id: string) => {
  try {
    const response = await axios.get(`${apiUrl}/api/contract/getcattechnicians`, {
      params: { cat_id },
      withCredentials: true
    });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteTechnicianFromUser = async (uname: string) => {
  try {
    const response = await axios.delete(`${apiUrl}/api/contract/deletetechnicianfromuser`, {  
      data: { uname },
      withCredentials: true
    });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteCatTech = async (cat_id: string, uname: string) => {
  try {
    const response = await axios.delete(`${apiUrl}/api/contract/deletecattech`, { 
      data: { cat_id, uname },
      withCredentials: true
    });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export async function addComplaintCategory(code: string, description: string) {
  return axios.post(`${apiUrl}/api/contract/addcomplaintcategory`, { code, description }, { withCredentials: true });
}

export async function deleteComplaintCategory(code: string) {
  return axios.delete(`${apiUrl}/api/contract/deletecomplaintcategory/${code}`, { withCredentials: true });
}

export const getAreas = async () => {
  try {
    const response = await axios.get(`${apiUrl}/api/contract/areas`, { withCredentials: true });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getMappedTechs = async (cat_id?: string, area_id?: string) => {
  try {
    const response = await axios.get(`${apiUrl}/api/contract/getmappedtechs`, {
      params: { cat_id, area_id },
      withCredentials: true
    });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getComplaintTypes = async (complaintNum: string) => {
  try {
    const response = await axios.get(`${apiUrl}/api/contract/getcomplainttypes`, {
      params: { complaintNum },
      withCredentials: true
    });
    return response.data;
  }
  catch (error: any) {
    return { success: false, error: error.message };
  } 
};

export const getChecklist = async () => {
  try {
    const response = await axios.get(`${apiUrl}/api/contract/getchecklist`, {

      withCredentials: true
    });
    return response.data;
  }
  catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const insertAssignedComplaints = async (assignment: any) => {
  try {
    const response = await axios.post(
      `${apiUrl}/api/contract/insertassignedcomplaint`,
      assignment, // <-- send the object, not { assignments: [...] }
      { withCredentials: true }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getAssignedComplaints = async (userid: string) => {
  try {
    const response = await axios.get(
      `${apiUrl}/api/contract/getassignedcomplaints`,
      {
        params: { userid },
        withCredentials: true
      }
    );
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const closeComplaint = async (complaint_id: string) => {
  try {    const response = await axios.post(
      `${apiUrl}/api/contract/closecomplaint`,
      { complaint_id },
      { withCredentials: true }
    );
    return response.data;
  }
    catch (error: any) {
    return { success: false, error: error.message };
  }
}