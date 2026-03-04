const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const { contracts,buildings, unit, tenant, technicians, equipments, Area, 
        insertchecklist,insertComplaint, GetComplaints, insertcomplaintdetails , 
        GetComplaintDetails, UpdateComplaintDetails, EditComplaint,
        DeleteComplaint, DeleteComplaintDetails, GetComplaintCategories,
        GetUserLists, AddTechnicians, addCatTech, GetCatTechnicians, GetMappedTechs,  
        DeleteTechnicianFromUser, DeleteCatTech, addComplaintCategory, deleteComplaintCategory,
        GetComplaintTypes, GetChecklist, GetCategoryItems, insertAssignedComplaint,
        getAssignedComplaints, CloseComplaint } = require('../controllers/contractController');

router.get('/contracts', contracts);
router.get('/buildings', buildings);
router.get('/units', unit);
router.get('/tenant', tenant)
router.get('/technicians', technicians);
router.get('/equipments', equipments)
router.get('/areas', Area);
router.post('/insertchecklist', upload.fields([
  { name: 'images' },
  { name: 'videos' }
]), insertchecklist);
router.post('/insertcomplaint', upload.fields([
  { name: 'images' },
  { name: 'videos' }
]), insertComplaint);
router.get('/getcomplaints', GetComplaints);
router.post('/insertcomplaintdetails', insertcomplaintdetails);
router.get('/getcomplaintdetails', GetComplaintDetails);
router.post('/updatecomplaintdetails', UpdateComplaintDetails);
router.post('/editcomplaint', EditComplaint);
router.delete('/deletecomplaint', DeleteComplaint);
router.delete('/deletecomplaintdetails', DeleteComplaintDetails);
router.get('/complaintcategories', GetComplaintCategories);
router.get('/userlists', GetUserLists);
router.post('/addtechnicians', AddTechnicians);
router.post('/addcattech', addCatTech);
router.get('/getcattechnicians', GetCatTechnicians);
router.delete('/deletetechnicianfromuser', DeleteTechnicianFromUser);
router.delete('/deletecattech', DeleteCatTech);
router.post('/addcomplaintcategory', addComplaintCategory);
router.delete('/deletecomplaintcategory', deleteComplaintCategory);
router.get('/getmappedtechs', GetMappedTechs);
router.get('/getcomplainttypes', GetComplaintTypes);
router.get('/getchecklist', GetChecklist);
router.get('/getcategoryitems', GetCategoryItems);
router.post('/insertassignedcomplaint', insertAssignedComplaint);
router.get('/getassignedcomplaints', getAssignedComplaints);
router.post('/closecomplaint', CloseComplaint);
module.exports = router;