const express = require('express');
const router = express.Router();
const { login, validateSession, testConnection, decryptPassword, initializeCompany } = require('../controllers/authController');

router.get('/testConnection', testConnection)
router.post('/initializeCompany', initializeCompany)
router.get('/decryptPassword', decryptPassword)
router.post('/login', login);
router.get('/validateSession', validateSession)
module.exports = router;