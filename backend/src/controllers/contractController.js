const { GridFSBucket } = require('mongodb');
const ContractModel = require('../models/contractModel');
const { connect } = require('../config/db');
const multer = require('multer');
const upload = multer();

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
    const { buildingId } = req.query;
    const units = await ContractModel.GetUnitsByBuilding(buildingId, req.session.companyConfig);
    res.json({ success: true, units });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
}

// Get tenant and contract details for a unit (for checklist autofill)
exports.tenant = async (req, res) => {
  try{
    const { buildingId, unitId } = req.query;
    const tenant = await ContractModel.GetTenantContractDetails(buildingId, unitId, req.session.companyConfig);
    if (!tenant) {
      return res.json({ success: false, error: 'No contract found for this unit/building' });
    }else{
    res.json({
      success: true,
      tenantCode: tenant.tenantCode,
      tenantName: tenant.tenantName,
      contractNo: tenant.contractNo,
      startDate: tenant.startDate,
      endDate: tenant.endDate
    });
    }
  }catch (err){
    res.json({success: false, error: err.message})
  }
}

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
      date, username, tenantCode, tenantName, building, unit, startDate, endDate, refNum
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
        counter: counter
      };

     await ContractModel.InsertChecklist(checklistDoc, req.session.companyConfig);
    }
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        await ContractModel.InsertChecklistImages(contract, refNum, file.buffer, file.mimetype, req.session.companyConfig);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
};