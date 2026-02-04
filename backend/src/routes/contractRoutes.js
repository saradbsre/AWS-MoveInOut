const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const { buildings, unit, tenant, equipments, insertchecklist } = require('../controllers/contractController');

router.get('/buildings', buildings);
router.get('/units', unit);
router.get('/tenant', tenant)
router.get('/equipments', equipments)
router.post('/insertchecklist', upload.fields([
  { name: 'images' },
  { name: 'videos' }
]), insertchecklist);
module.exports = router;