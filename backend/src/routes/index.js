const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const contractRoutes = require('./contractRoutes');
const estimationRoutes = require('./estimationRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/contract', contractRoutes);
router.use('/estimationcost', estimationRoutes);

module.exports = router;