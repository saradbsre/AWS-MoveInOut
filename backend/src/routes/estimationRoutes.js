const express = require('express');
const router = express.Router();

const { checklistforestimation, fetchItemPrice, SaveEstimationCost } = require('../controllers/estimationController');

router.get('/checklistforestimation', checklistforestimation);
router.get('/fetchItemPrice', fetchItemPrice);
router.post('/SaveEstimationCost', SaveEstimationCost);
module.exports = router;