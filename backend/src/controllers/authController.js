const AuthModel = require('../models/authModel');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const DeviceDetector = require('device-detector-js');
const detector = new DeviceDetector();
const { getCompanyConfigByDomain } = require('../config/db');

exports.initializeCompany = async (req, res) => {
  const { domain } = req.body;
  try {
    const companyConfig = await getCompanyConfigByDomain(domain);
    req.session.companyConfig = companyConfig; // Store in session
    req.session.save(err => {
      if (err) {
        console.log('Session save error:', err);
        return res.status(500).json({ success: false, error: 'Session save failed' });
      }
      res.json({ success: true });
    });
  } catch (err) {
    console.log('Error initializing company:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Test connecton endpoint
exports.testConnection = async (req, res) => {
  try {
    const test = await AuthModel.testConnection();  
    res.json({ success: true, message: 'Database connection successful', test });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection failed', error: err.message });
  }
}

// Test connecton endpoint
exports.decryptPassword = async (req, res) =>{
  try{
    const {username} = req.body;
    const decrypt = await AuthModel.decryptPassword(username)
    res.json({success: true, decryptedPassword: decrypt});
  }catch(err){
    res.status(500).json({ success: false, message: 'Decryption failed', error: err.message });
  }
}

// Login endpoint using sessions table
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const trimmedUsername = username ? username.trim() : '';
    const trimmedPassword = password ? password.trim() : '';
    // console.log(`Looking for user with username: "${trimmedUsername}"`);
    // Check for existing active session
    const activeSession = await AuthModel.findActiveSession(username, req.session.companyConfig);
    if (activeSession) {
      return res.json({
        success: false,
        message: 'User is already logged in from another session.'
      });
    }

    // Find user
    const user = await AuthModel.FindUserByUsername(username, req.session.companyConfig);
    let tenantName = '';
    let tenantContracts = [];
    if (user.roleid === 'TENANT') {
      console.time('Tenant Queries');
      const tenantDoc = await AuthModel.FindTenantByUsername(user.Uname);
      if (tenantDoc && tenantDoc.CTenantName) {
        tenantName = tenantDoc.CTenantName;
      }
      tenantContracts = await AuthModel.FindTenant(user.Uname);
      console.timeEnd('Tenant Queries');
      if (tenantContracts.length > 0) {
        tenantContracts.sort((a, b) => new Date(b.contract_sdate) - new Date(a.contract_sdate));
        var latestContract = tenantContracts[0];
      } else {
        var latestContract = null;
      }
    }

    if (!user) {
      return res.json({
        success: false,
        message: 'Invalid User.'
      });
    }
    // Decrypt password (use your existing method)
    const passwordMatch = (trimmedPassword === user.decryptedPassword);
  
    if (!passwordMatch) {
      return res.json({ success: false, message: 'Invalid password.' });
    }

    // Get module access for role
    const accessRecords = await AuthModel.GetModuleAccess(user.roleid, req.session.companyConfig);
    const modules = accessRecords.map(row => ({
      name: row.module,
      path: row.mdefault,
      accessKey: row.type,
      permissions: {
        access: row.access,
        add: row.add,
        delete: row.delete,
        modify: row.modify,
        print: row.print
      }
    }));

    const accessKeys = accessRecords.map(row => row.type);

    // Device + IP
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    const userAgent = req.headers['user-agent'];
    const device = detector.parse(userAgent);
    const machineIdSource = `${ip}-${userAgent}`;
    const machineId = crypto.createHash('md5').update(machineIdSource).digest('hex');
    const deviceName = device.device
      ? `${device.device.brand || ''} ${device.device.model || ''} (${device.os?.name || 'Unknown OS'})`
      : `${device.os?.name || 'Unknown'} Device`;

    // Store user data in session
    req.session.user = {
      username: user.Uname,
      role: user.roleid,
      DefaultMod: user.defaultmod,
      access: accessKeys,
      modules: modules,
      loginTime: new Date(),
      lastActivity: new Date(),
      machineId: machineId,
      deviceName: deviceName.trim(),
      ipAddress: ip,
      ...(tenantName ? { tenantName } : {})
    };
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.json({ success: false, error: 'Session save failed' });
      }

      res.json({
        success: true,
        username: user.uname,
        role: user.roleid,
        DefaultMod: user.defaultmod,
        access: accessKeys,
        modules: modules,
        contracts: tenantContracts || [],
        ...(tenantName ? { tenantName } : {})
      });
    });

  } catch (err) {
    console.error('Error during login:', err);
    console.timeEnd('Total Login Time');
    res.json({ success: false, error: err.message });
  }
};

// Add session validation endpoint
exports.validateSession = async (req, res) => {
  if (req.session.user && req.session.companyConfig) {
    // No need to check is_logged_in anymore
    // If the session exists, it's valid (express-session handles expiration)
    res.json({
      success: true,
      user: req.session.user
    });
  } else {
    res.json({ success: false});
  }
}