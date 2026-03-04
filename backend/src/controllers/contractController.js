const { GridFSBucket } = require('mongodb');
const ContractModel = require('../models/contractModel');
const { connect } = require('../config/db');
const multer = require('multer');
const upload = multer();
const sharp = require('sharp');

async function compressImage(file) {
  // keep non-images unchanged
  if (!file?.mimetype?.startsWith('image/')) {
    return { buffer: file.buffer, mimetype: file.mimetype };
  }

  // resize + convert to webp
  let quality = 75;
  let out = await sharp(file.buffer)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  // optional: reduce more if still large (> 400 KB)
  while (out.length > 400 * 1024 && quality > 45) {
    quality -= 5;
    out = await sharp(file.buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  }

  return { buffer: out, mimetype: 'image/webp' };
}


// Get contracts with contract_cflag = N

exports.contracts = async (req, res) => {
  try {
    const contracts = await ContractModel.GetContracts(req.session.companyConfig);
    res.json({ success: true, contracts });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

// Get all buildings
exports.buildings = async (req, res) => {
  try {
    const buildings = await ContractModel.GetAllBuildings(req.session.companyConfig);

    res.json({ success: true, buildings });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

// Get units for a building
exports.unit = async (req, res) => {
  try {
    const { buildingId, contractId } = req.query;
    let units;
    if (contractId && buildingId) {
      // Fetch units by contract and building
      units = await ContractModel.GetUnitsByContract(buildingId, contractId, req.session.companyConfig);
    } else if (buildingId) {
      // Fetch units by building only
      units = await ContractModel.GetUnitsByBuilding(buildingId, req.session.companyConfig);
    } else {
      return res.json({ success: false, error: 'Missing required parameters' });
    }
    res.json({ success: true, units });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
}

// Get tenant and contract details for a unit (for checklist autofill)
exports.tenant = async (req, res) => {
  try {
    const { buildingId, unitId, contractId } = req.query;
    if (buildingId && unitId) {
      // Both values provided: get tenant for building/unit
      const tenant = await ContractModel.GetTenantContractDetails(buildingId, unitId, req.session.companyConfig);
      if (!tenant) {
        return res.json({ success: false, error: 'No contract found for this unit/building' });
      }
      res.json({
        success: true,
        tenantCode: tenant.tenantCode,
        tenantName: tenant.tenantName,
        contractNo: tenant.contractNo,
        startDate: tenant.startDate,
        endDate: tenant.endDate,
        unitType: tenant.unitType,
        unitNature: tenant.unitNature,
        placeDesc: tenant.placeDesc
      });
    } else if (contractId) {
      // Only contractId provided: get tenant/contract by contractId
      const tenants = await ContractModel.GetTenantContractDetailsByContractId(contractId, req.session.companyConfig);
      if (!tenants || tenants.length === 0) {
        return res.json({ success: false, error: 'No contracts found for this contractId' });
      }
      res.json({
        success: true,
        tenants // array of tenants/contracts
      });
    } else {
      res.json({ success: false, error: 'Missing required parameters' });
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.technicians = async (req, res) => {
  try {
    const { build_id, area_id } = req.query;
    const technicians = await ContractModel.GetTechnicians(req.session.companyConfig, build_id, area_id);
    res.json({ success: true, technicians });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.equipments = async (req, res) => {
  try {
    const equipment = await ContractModel.GetEquipmentMasterList(req.session.companyConfig);
    // Define available field types for the dropdown - match your MongoDB field names
    const fieldTypes = ['group', 'category', 'brand', 'subbrand', 'itemno'];
    res.json({
      success: true,
      equipment,
      fieldTypes
    });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
}

exports.insertchecklist = async (req, res) => {
  try {
    const {
      contract, visitType, equipment, barcode, tenantsignature, techniciansignature,
      date, username, tenantCode, tenantName, building, unit, startDate, endDate, refNum, subComp_id
    } = req.body;
    // Parse equipment if it's a JSON string
    const equipmentArray = Array.isArray(equipment) ? equipment : JSON.parse(equipment);
    const imageBuffer = req.files.buffer;
    
    // Insert checklist document (without files yet)
    let counter = 0;
    for (const eq of equipmentArray) {
      counter += 1;
      const checklistDoc = {
        contract_id: contract,
        visitType,
        barcode,
        tenantsignature,
        techniciansignature,
        created_at: new Date(date),
        userid: username,
        tenantCode,
        tenantName,
        build_id: building,
        unit_desc: unit,
        startDate,
        endDate,
        refNum,
        // Equipment fields
        itemno: eq.itemno,
        itemname: eq.itemname,
        brdcode: eq.brdcode,
        subcode: eq.subcode,
        unit: eq.unit,
        qty: eq.qty,
        status: eq.status,
        remarks: eq.remarks,
        counter: counter,
        subComp_id: subComp_id
      };

     await ContractModel.InsertChecklist(checklistDoc, req.session.companyConfig);
    }
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        const compressed = await compressImage(file);
        await ContractModel.InsertChecklistImages(
          contract,
          refNum,
          compressed.buffer,
          compressed.mimetype,
          req.session.companyConfig
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.insertComplaint = async (req, res) => {
  try {
    const {
      complaint_id,
      complaintNum,
      complaintType,
      build_id,
      build_desc,
      unit_desc,
      block,
      floor,
      accessArea,
      both,
      CTenantName,
      contract_id,
      contract_sdate,
      contract_edate,
      type,
      description,
      status,
      auditrev,
      userid,
      Date,
      assigned,
      preparedBy,
      authLevel,
      authStatus
    } = req.body;

    //console.log("Received complaint data:", req.body);

    await ContractModel.InsertComplaint({
      complaint_id,
      complaintNum,
      complaintType,
      build_id,
      build_desc,
      unit_desc,
      block,
      floor,
      accessArea,
      both,
      CTenantName,
      contract_id,
      contract_sdate,
      contract_edate,
      type,
      description,
      status,
      auditrev,
      userid,
      Date,
      assigned,
      preparedBy,
      authLevel,
      authStatus
    }, req.session.companyConfig);

    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        const compressed = await compressImage(file);
        await ContractModel.InsertComplaintImages(
          build_id,
          complaintNum,
          compressed.buffer,
          compressed.mimetype,
          req.session.companyConfig
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.insertcomplaintdetails = async (req, res) => {
  try {
    const {
      complaint_id,
      complaintNum,
      build_id,
      build_desc,
      unit_desc,
      both,
      CTenantName,
      contract_id,
      status,
      assigned_to,
      assigned_by,
      assigned_date,
      category,
      remarks,
      auditrev,
      userid,
      Date,
      itemname,
      itemno,
      qty,
      barcode,
      counter,
      tenantsignature,
      techniciansignature,
      brdcode,
      subcode,
      unit,
      contract_sdate,
      contract_edate

    } = req.body;
    //console.log("Received complaint details data:", req.body);
    await ContractModel.InsertComplaintDetails({
      complaint_id,
      complaintNum,
      build_id,
      build_desc,
      unit_desc,
      both,
      CTenantname: CTenantName,
      contract_id,
      status,
      assigned_to,
      assigned_by,
      assigned_date,
      category,
      remarks,
      auditrev,
      userid,
      Date,
      itemname,
      itemno,
      qty,
      barcode,
      counter,
      tenantsignature,
      techniciansignature,
      brdcode,
      subcode,
      unit,
      contract_sdate,
      contract_edate

    }, req.session.companyConfig);
    
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};


exports.GetComplaints = async (req, res) => {
  try {
    const complaints = await ContractModel.GetComplaints(req.session.companyConfig);
    res.json({ success: true, complaints });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.GetComplaintDetails = async (req, res) => {
  try {
    //const { area_id, build_id } = req.query;
    // Pass both area_id and build_id to the model (model will handle logic)
    const complaintDetails = await ContractModel.GetComplaintDetails(
      req.session.companyConfig
    );
    res.json({ success: true, complaintDetails });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.UpdateComplaintDetails = async (req, res) => {
  try {
    const {
      complaint_id,
      subComp_id,
      status,
      assigned_to,
      assigned_by,
      assigned_date,
      auditrev
    } = req.body;

    await ContractModel.UpdateComplaintDetails({
      complaint_id,
      subComp_id,
      status,
      assigned_to,
      assigned_by,
      assigned_date,
      auditrev
    }, req.session.companyConfig);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.EditComplaint = async (req, res) => {
  try {
    const { complaint_id, description, block, floor, place, build_desc, unit_desc, status, approvedBy, authLevel, authStatus } = req.body;
    await ContractModel.EditComplaint(
      complaint_id,
      description,
      block,
      floor,
      place,
      build_desc,
      unit_desc,
      status,
      approvedBy,
      authLevel,
      authStatus,
      req.session.companyConfig
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.DeleteComplaint = async (req, res) => {
  try {
    const { complaint_id } = req.body;
    await ContractModel.DeleteComplaint(complaint_id, req.session.companyConfig);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.DeleteComplaintDetails = async (req, res) => {
  try {
    const { complaint_id, subComp_id } = req.body;
    await ContractModel.DeleteComplaintDetails(complaint_id, subComp_id, req.session.companyConfig);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.GetComplaintCategories = async (req, res) => {
  try {
    const categories = await ContractModel.GetComplaintCategories(req.session.companyConfig);
    res.json({ success: true, categories });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.GetCategoryItems = async (req, res) => {
  try {
    const { sscode } = req.query;
    const items = await ContractModel.GetCategoryItems(req.session.companyConfig, sscode);
    res.json({ success: true, items });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.GetUserLists = async (req, res) => {
  try {
    const { technician } = req.query;
    const users = await ContractModel.GetUserLists(req.session.companyConfig, technician);
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.AddTechnicians = async (req, res) => {
  try {    const { technicians } = req.body;
    await ContractModel.AddTechnicians(req.session.companyConfig, technicians);
    res.json({ success: true });
  } catch (err) {
    console.error(err);   
    res.json({ success: false, error: err.message });
  }
};

exports.addCatTech = async (req, res) => {
  const { area_ids, userid, technicians, cat_id } = req.body;
  try {
    await ContractModel.AddCatTech(req.session.companyConfig, area_ids, userid, technicians, cat_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.GetCatTechnicians = async (req, res) => {
  try {
    const { cat_id } = req.query;
    const techs = await ContractModel.GetCatTechnicians(req.session.companyConfig, cat_id);
    res.json({ success: true, technicians: techs });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.DeleteTechnicianFromUser = async (req, res) => {
  try {
    const { uname } = req.body;
    if (!uname) {
      return res.json({ success: false, error: "Missing required field: uname" });
    }
    await ContractModel.DeleteTechnicianFromUser(req.session.companyConfig, uname);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.DeleteCatTech = async (req, res) => {
  try {
    const { cat_id, uname } = req.body;
    if (!cat_id || !uname) {
      return res.json({ success: false, error: "Missing required fields: cat_id and uname" });
    }
    await ContractModel.DeleteCatTech(req.session.companyConfig, cat_id, uname);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.addComplaintCategory = async (req, res) => {
  const { code, description } = req.body;
  try {
    await ContractModel.AddComplaintCategory(req.session.companyConfig, code, description);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteComplaintCategory = async (req, res) => {
  const { code } = req.params;
  try {
    await ContractModel.DeleteComplaintCategory(req.session.companyConfig, code);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.Area = async (req, res) => {
  try {
    const areas = await ContractModel.GetArea(req.session.companyConfig);
    res.json({ success: true, areas });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.GetMappedTechs = async (req, res) => {
  try {
    const { cat_id, area_id } = req.query;
    
    const techs = await ContractModel.GetMappedTechs(req.session.companyConfig, cat_id, area_id);
    
    res.json({ success: true, technicians: techs });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.GetComplaintTypes = async (req, res) => {
  try {
    const { complaintNum } = req.query;
    const complaintTypes = await ContractModel.GetComplaintTypes(req.session.companyConfig, complaintNum);
    res.json({ success: true, complaintTypes });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.GetChecklist = async (req, res) => {
  try {
    let checklistItems = await ContractModel.GetChecklist(req.session.companyConfig);
    // Filter out nulls
    checklistItems = checklistItems.filter(item => item != null);
    res.json({ success: true, checklistItems });
  }
  catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.insertAssignedComplaint = async (req, res) => {
  try {
    const data = req.body;
   // console.log("Received data for assigned complaint:", data);
    await ContractModel.InsertAssignedComplaint(data, req.session.companyConfig);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.getAssignedComplaints = async (req, res) => {
  try {    const { userid } = req.query;
    const complaints = await ContractModel.GetAssignedComplaints(userid,req.session.companyConfig);
    res.json({ success: true, complaints });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};

exports.CloseComplaint = async (req, res) => {
  try {
    const { complaint_id } = req.body;
    await ContractModel.CloseComplaint(complaint_id, req.session.companyConfig);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};