const EstimationModel = require('../models/estimationModel');
const { connect } = require('../config/db');

//Get Checklist for Estimation Cost
exports.checklistforestimation = async (req, res) => {
  try {

    const checklist = await EstimationModel.GetChecklistForEstimation(req.session.companyConfig);

    res.json({ success: true, checklist });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

exports.fetchItemPrice = async (req, res) => {
  try {
    const {itemno} = req.query;
    const itemPrices = await EstimationModel.FetchItemPrices(itemno, req.session.companyConfig);
    res.json({ success: true, itemPrices: itemPrices });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
}

exports.SaveEstimationCost = async (req, res) => {
  try{
    const { equipment, srno } = req.body;
    const equipmentArray = Array.isArray(equipment) ? equipment : JSON.parse(equipment);
    
    if (!srno && !Array.isArray(equipmentArray)) {
      return res.json({ success: false, error: 'Missing srno or equipment data' });
    }
    
    await EstimationModel.DeleteAllEquipment(srno, req.session.companyConfig); 

    for (const item of equipmentArray){
      await EstimationModel.InsertEquipmentItem(srno, item, req.session.companyConfig);
    }

    res.json({ success: true, message: 'Estimation cost saved successfully' });
    
  }catch(err){
    res.json({ success: false, error: err.message });
  }
}