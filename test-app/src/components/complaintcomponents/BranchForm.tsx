const accessConfig = {
  building: { disabled: false, hidden: false },
  unit: { disabled: false, hidden: false },
  type: { disabled: false, hidden: false },
  block: { disabled: false, hidden: false },
  place: { disabled: false, hidden: false },
  floor: { disabled: false, hidden: false },
  description: { disabled: false, hidden: false },
  categories: { hidden: true }, // Hide Category & Remarks for branch
  technician: { hidden: true }, // Hide technician field for branch
  image: { hidden: false },
  video: { hidden: false }
};

const BranchForm = {
  getAccessConfig: () => accessConfig
};

export default BranchForm;