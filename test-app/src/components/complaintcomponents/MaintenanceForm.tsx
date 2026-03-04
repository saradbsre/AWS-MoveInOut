import * as ContractAPI from '@/services/Transaction/Contract/Contractapi';

const accessConfig = {
  building: { disabled: true, hidden: false },
  unit: { disabled: true, hidden: false },
  type: { disabled: false, hidden: false },
  block: { disabled: true, hidden: false },
  place: { disabled: true, hidden: false },
  floor: { disabled: true, hidden: false },
  description: { disabled:true, hidden: false},
  categories: { disabled: false, hidden: false },
  technician: { disabled: false, hidden: false },
  image: { hidden: true },
  video: { hidden: true }
};

const getAccessConfig = () => accessConfig;

const getTechnicians = async () => {
  const data = await ContractAPI.getTechnicians();
  return (data.technicians || []).map((t: any) => ({
    tech_id: t.Uname || t.tech_id || '',
    tech_name: t.Uname || t.tech_name || '',
  }));
};

const getComplaintCategories = async () => {
  const data = await ContractAPI.getComplaintCategories();
  return (data.categories || []);
};

const MaintenanceForm = {
  getAccessConfig,
  getTechnicians,
  getComplaintCategories
};

export default MaintenanceForm;