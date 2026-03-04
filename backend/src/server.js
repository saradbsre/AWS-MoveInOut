// Third-party modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const session = require('express-session');
const sql = require('mssql');
const MSSQLStore = require('connect-mssql-v2');
const multer = require('multer');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
// const DeviceDetector = require('device-detector-js');
const PdfPrinter = require('pdfmake');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Local modules
const { connectMaster, connectEstate, connectFinance } = require('./config/db');

const routes = require('./routes');

// Font setup for PDF
const fonts = {
  Times: {
    normal: path.join(__dirname, 'fonts', 'times.ttf'),
    bold: path.join(__dirname, 'fonts', 'TimesBold.ttf'),
    italics: path.join(__dirname, 'fonts', 'TimesItalic.ttf'),
    bolditalics: path.join(__dirname, 'fonts', 'TimesBoldItalic.ttf')
  }
};
const printer = new PdfPrinter(fonts);

// Express app setup
const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://portal.abdulwahedbinshabibproperty.com', 'https://portal.bsre.abdulwahedbinshabibproperty.com', 
      'https://portal.hamda.abdulwahedbinshabibproperty.com', 'https://aws-moveinout.onrender.com']
    : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(bodyParser.json({ limit: '20mb' }));
app.set('trust proxy', 1);
app.use(session({
  store: new MSSQLStore({
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      server: process.env.SQL_SERVER,
      port: parseInt(process.env.SQL_PORT),
      database: process.env.SQL_DATABASE,
      options: {
        encrypt: false,
        trustServerCertificate: true // Change to true for local dev
    },
    collectionName: 'sessions'
    // autoRemove: true,
    // autoRemoveInterval: 20
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    // maxAge: 20 * 60 * 1000
  }
}));

// Mount API routes
app.use('/api', routes);

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

// Utility to decrypt password (simple AES for demonstration)
function decryptPassword(encrypted, key) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.alloc(16, 0));
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function getDubaiDateTimeString(date = new Date()) {
  const dubaiDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
  const yyyy = dubaiDate.getFullYear();
  const dd = String(dubaiDate.getDate()).padStart(2, '0');
  const mm = String(dubaiDate.getMonth() + 1).padStart(2, '0');
  const hh = String(dubaiDate.getHours()).padStart(2, '0');
  const min = String(dubaiDate.getMinutes()).padStart(2, '0');
  const ss = String(dubaiDate.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

async function GetNextTransactionNo(moduleName, companyConfig) {
  const db = await connectFinance(companyConfig);
  const request = db.request();
  request.input('moduleName', sql.NVarChar, moduleName);

  const result = await request.query(`
    MERGE WebTrno AS target
    USING (SELECT @moduleName AS moduleName) AS source
    ON target.moduleName = source.moduleName
    WHEN MATCHED THEN
      UPDATE SET trno = trno + 1
    WHEN NOT MATCHED THEN
      INSERT (moduleName, trno) VALUES (@moduleName, 1)
    OUTPUT inserted.trno;
  `);

  return result.recordset[0].trno;
}

async function GetNextSerialNo(moduleName, companyConfig) {
  const db = await connectFinance(companyConfig);
  const request = db.request();
  request.input('moduleName', sql.NVarChar, moduleName);

  const result = await request.query(`
    MERGE WebSrno AS target
    USING (SELECT @moduleName AS moduleName) AS source
    ON target.moduleName = source.moduleName
    WHEN MATCHED THEN 
      UPDATE SET srno = srno + 1
    WHEN NOT MATCHED THEN
      INSERT (moduleName, srno) VALUES (@moduleName, 1)
    OUTPUT inserted.srno;
  `);

  return result.recordset[0].srno;
}

// Audit Log Function - Logs all operations with key identifiers
async function createAuditLog({
  module,
  action,
  referenceId,
  referenceField,
  username,
  details = {},
  status = 'success'
}) {
  try {
    const db = await connect();
    
    const auditLog = {
      module,           // e.g., 'Estimation Cost', 'Checklist', 'User Management', 'Contract'
      action,           // e.g., 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'VERIFY'
      referenceId,      // e.g., RefNum, Srno, contract_id, username
      referenceField,   // e.g., 'RefNum', 'Srno', 'contract_id', 'Uname'
      username: username || 'system',
      timestamp: new Date(),
      dubaiTime: getDubaiDateTimeString(),
      status,           // 'success' or 'failed'
      details,          // Additional context like { authLevel: 2, authStatus: 'Approved' }
      ipAddress: null   // Can be added if needed
    };
    
    await db.collection('dbo.audit_logs').insertOne(auditLog);
  } catch (err) {
    console.error('Failed to create audit log:', err.message);
    // Don't throw error - audit log failure shouldn't break the main operation
  }
}

const { GridFSBucket, ObjectId } = require('mongodb');

// app.get('/api/item-price/:itemno', async (req, res) => {
//   try {
//     const db = await connectFinance(req.session.companyConfig); // Use the finance DB connection
//     const itemno = req.params.itemno;

//     const request = db.request();
//     request.input('itemno', sql.NVarChar, itemno);

//     const result = await request.query(`
//       SELECT TOP 1 retprice FROM citem WHERE itemno = @itemno
//     `);

//     if (!result.recordset.length) {
//       return res.status(404).json({ success: false, message: 'Item not found' });
//     }

//     res.json({ success: true, retprice: result.recordset[0].retprice || 0 });
//   } catch (err) {
//     console.error('Error fetching item price:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

app.get('/api/keep-alive', async (req, res) => {
  if (req.session.user) {
    try {  
      // Force session data change by updating lastActivity
      const dubaiNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
      req.session.user.lastActivity = dubaiNow;
      
      // IMPORTANT: Reset the cookie maxAge to refresh the TTL
      req.session.cookie.maxAge = 60 * 60 * 1000;
      
      req.session.touch();
      
      req.session.save(err => {
        if (err) {
          console.error('Error saving session:', err);
          return res.status(500).json({ success: false, error: 'Could not extend session' });
        }
        res.json({
          success: true,
          message: 'Session extended',
          username: req.session.user.username,
          timestamp: getDubaiDateTimeString(),
          expiresAt: getDubaiDateTimeString(new Date(Date.now() + req.session.cookie.maxAge))
        });
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      res.status(500).json({ success: false, error: 'Unexpected error' });
    }
  } else {
    res.status(401).json({ success: false, message: 'No valid session' });
  }
});

// Add logout endpoint
app.post('/api/logout', async (req, res) => {
  // Simply destroy the session - no need to update is_logged_in
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// API to send checklist PDF to tenant
app.post('/api/send-report', async (req, res) => {
  // Debug log for incoming request body
  // console.log('POST /api/send-report body:', req.body);
  const pdfBase64 = req.body.pdfBase64;
  const contractId = req.body.contractId;
  const subject = req.body.subject;
  const text = req.body.text;

  // console.log(contractId)
  if (!pdfBase64 || typeof pdfBase64 !== 'string' || !pdfBase64.trim()) {
    return res.status(400).json({ success: false, error: 'Missing or invalid PDF data', received: req.body });
  }
  if (!contractId) {
    return res.status(400).json({ success: false, error: 'Missing contractId', received: req.body });
  }
  let pdfBuffer;
  try {
    pdfBuffer = Buffer.from(pdfBase64, 'base64');
    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      throw new Error('Invalid PDF buffer');
    }
  } catch (e) {
    return res.status(400).json({ success: false, error: 'Failed to decode PDF base64 data' });
  }
  try {
    await connect();
    // Get tenant email from contract and tenant master
    // const result = await sql.query`
    //   SELECT t.email
    //   FROM Contracts c
    //   JOIN Tenants t ON c.tenant_id = t.id
    //   WHERE c.id = ${contractId}
    // `;
    // if (!result.recordset.length || !result.recordset[0].email) {
    //   return res.status(400).json({ success: false, error: 'Tenant email not found for contract' });
    // }
    // const tenantEmail = result.recordset[0].email;
    // Store the encrypted password and key in env for security
    const user = process.env.MAIL_USER;
    const reciever = process.env.MAIL_USER_RECIEVER;
    const ccreciever = process.env.MAIL_USER_CCRECIEVER;
    const encryptedPass = process.env.MAIL_PASS_ENC;
    const key = process.env.MAIL_KEY;
    const tenantName = req.body.tenantName || '[Tenant Name]';
    // console.log('MAIL_PASS_ENC:', encryptedPass, 'length:', encryptedPass ? encryptedPass.length : 0);
    // console.log('MAIL_KEY:', key, 'length:', key ? key.length : 0);
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      // console.log('Buffer.from(key, "hex") length:', keyBuffer.length);
      const password = decryptPassword(encryptedPass, key);
      // continue as normal
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // SSL
        requireTLS: true,
        auth: {
          user: user,
          pass: password
        }
      });
      await transporter.sendMail({
        from: user,
        to: reciever,
        cc: ccreciever,
        subject: subject || `${req.body.visitType || 'Move-Out'} Checklist Report for Your Unit – ${req.body.buildingName || '[Building Name]'} / ${req.body.unitNumber || '[Unit No]'}`,
        html: text ||
          `<div style="font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.6; color: #000;">
          <p><strong>Dear Mr./Mrs.${tenantName},</strong></p>
          
          <p>Greetings from the Handover Team.</p>
          
          <p>Please find attached the ${req.body.visitType || 'Move-Out'} Checklist Report for your unit <strong>${req.body.unitNumber || '[Unit Number]'}</strong> / <strong>${req.body.buildingName || '[Property Name]'}</strong>, which was prepared during your handover process. The report outlines the condition of the items and equipment in the unit at the time of your ${req.body.visitType ? req.body.visitType.toLowerCase() : 'move-out'} inspection.</p>
          
          <p>We kindly request you to review the attached report. If you have any questions or concerns regarding any of the checklist items, please do not hesitate to contact us.</p>
          
          <p>Thank you for your cooperation throughout your tenancy, and we wish you all the best in your future endeavors.</p>
          
          <p>Warm regards,<br>
          <strong>${req.body.coordinatorName || '[Your Name]'}</strong><br>
          <strong>${req.body.companyName || 'ABDULWAHED AHMAD RASHED BIN SHABIB'}</strong><br>
          <strong>${req.body.contactNumber || '[Contact Number]'}</strong><br>
          <strong>${req.body.emailAddress || user}</strong></p>
        </div>`,
        attachments: [
          {
            filename: 'Checklist_Report.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });
      res.json({ success: true });
      return;
    } catch (e) {
      console.error('Decryption or mail config error:', e);
      return res.status(500).json({ success: false, error: 'Decryption or mail config error: ' + e.message });
    }
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/send-complaintreport', async (req, res) => {
  // Debug log for incoming request body
  // console.log('POST /api/send-report body:', req.body);
  const pdfBase64 = req.body.pdfBase64;
  const contractId = req.body.contractId;
  const subject = req.body.subject;
  const text = req.body.text;

  // console.log(contractId)
  if (!pdfBase64 || typeof pdfBase64 !== 'string' || !pdfBase64.trim()) {
    return res.status(400).json({ success: false, error: 'Missing or invalid PDF data', received: req.body });
  }
  if (!contractId) {
    return res.status(400).json({ success: false, error: 'Missing contractId', received: req.body });
  }
  let pdfBuffer;
  try {
    pdfBuffer = Buffer.from(pdfBase64, 'base64');
    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      throw new Error('Invalid PDF buffer');
    }
  } catch (e) {
    return res.status(400).json({ success: false, error: 'Failed to decode PDF base64 data' });
  }
  try {
    await connectMaster();
    // Get tenant email from contract and tenant master
    // const result = await sql.query`
    //   SELECT t.email
    //   FROM Contracts c
    //   JOIN Tenants t ON c.tenant_id = t.id
    //   WHERE c.id = ${contractId}
    // `;
    // if (!result.recordset.length || !result.recordset[0].email) {
    //   return res.status(400).json({ success: false, error: 'Tenant email not found for contract' });
    // }
    // const tenantEmail = result.recordset[0].email;
    // Store the encrypted password and key in env for security
    const user = process.env.MAIL_USER;
    const reciever = process.env.MAIL_USER_RECIEVER;
    const ccreciever = process.env.MAIL_USER_CCRECIEVER;
    const encryptedPass = process.env.MAIL_PASS_ENC;
    const key = process.env.MAIL_KEY;
    const tenantName = req.body.tenantName || '[Tenant Name]';
    // console.log('MAIL_PASS_ENC:', encryptedPass, 'length:', encryptedPass ? encryptedPass.length : 0);
    // console.log('MAIL_KEY:', key, 'length:', key ? key.length : 0);
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      // console.log('Buffer.from(key, "hex") length:', keyBuffer.length);
      const password = decryptPassword(encryptedPass, key);
      // continue as normal
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // SSL
        requireTLS: true,
        auth: {
          user: user,
          pass: password
        }
      });
      await transporter.sendMail({
        from: user,
        to: reciever,
        cc: ccreciever,
        subject: subject || `Complaint Report for Your Unit – ${req.body.buildingName || '[Building Name]'} / ${req.body.unitNumber || '[Unit No]'}`,
        html: text ||
          `<div style="font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.6; color: #000;">
          <p><strong>Dear Mr./Mrs.${tenantName},</strong></p>
          
          <p>Greetings from the Handover Team.</p>
          
          <p>Please find attached the Complaint Report for your unit <strong>${req.body.unitNumber || '[Unit Number]'}</strong> / <strong>${req.body.buildingName || '[Property Name]'}</strong>, which was prepared during your handover process. The report outlines the condition of the items and equipment in the unit at the time of your ${req.body.visitType ? req.body.visitType.toLowerCase() : 'move-out'} inspection.</p>
          
          <p>We kindly request you to review the attached report. If you have any questions or concerns regarding any of the checklist items, please do not hesitate to contact us.</p>
          
          <p>Thank you for your cooperation throughout your tenancy, and we wish you all the best in your future endeavors.</p>
          
          <p>Warm regards,<br>
          <strong>${req.body.coordinatorName || '[Your Name]'}</strong><br>
          <strong>${req.body.companyName || 'ABDULWAHED AHMAD RASHED BIN SHABIB'}</strong><br>
          <strong>${req.body.contactNumber || '[Contact Number]'}</strong><br>
          <strong>${req.body.emailAddress || user}</strong></p>
        </div>`,
        attachments: [
          {
            filename: 'Checklist_Report.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });
      res.json({ success: true });
      return;
    } catch (e) {
      console.error('Decryption or mail config error:', e);
      return res.status(500).json({ success: false, error: 'Decryption or mail config error: ' + e.message });
    }
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// app.post('/api/generate-report-pdf', async (req, res) => {
//   try {
//     const reportData = req.body;

//     // Validate images are proper data URLs
//     const isValidDataUrl = (str) =>
//       typeof str === 'string' && /^data:image\/(png|jpeg);base64,/.test(str);

//     const headerImage =
//       isValidDataUrl(reportData.headerImageBase64) ? reportData.headerImageBase64 : null;
//     const barcodeImage =
//       isValidDataUrl(reportData.barcodeBase64) ? reportData.barcodeBase64 : null;

//     if (reportData.headerImageBase64 && !headerImage) {
//       console.warn('Invalid headerImageBase64 received');
//     }
//     if (reportData.barcodeBase64 && !barcodeImage) {
//       console.warn('Invalid barcodeBase64 received');
//     }

//     const docDefinition = {
//       content: [
//         // Header image (if valid)
//         headerImage
//           ? { image: headerImage, width: 500, alignment: 'center', margin: [0, 0, 0, 10] }
//           : { text: 'Checklist Report', style: 'header' },

//         // Barcode image (if valid)
//         barcodeImage
//           ? { image: barcodeImage, width: 200, alignment: 'right', margin: [0, 0, 0, 10] }
//           : '',

//         { text: 'Checklist Report', style: 'header' },
//         { text: `Building: ${reportData.building}` },
//         { text: `Unit: ${reportData.unit}` },
//         { text: `Tenant: ${reportData.tenant}` },
//         { text: `Contract No: ${reportData.contractNo}` },
//         { text: `Start Date: ${reportData.startDate}` },
//         { text: `End Date: ${reportData.endDate}` },
//         { text: `Visit Type: ${reportData.visitType}` },
//         { text: `Submission Date: ${new Date(reportData.submissionDate).toLocaleString()}` },
//         '\n',
//         { text: 'Equipment Checklist', style: 'subheader' },
//         {
//           table: {
//             headerRows: 1,
//             widths: ['auto', '*', 'auto', 'auto', 'auto', '*'],
//             body: [
//               [
//                 'SI No', 'Item Name', 'Unit', 'QTY', 'Status', 'Remarks'
//               ],
//               ...(reportData.equipment || []).map((item, idx) => [
//                 idx + 1,
//                 item.itemname,
//                 item.unit,
//                 item.qty,
//                 item.status,
//                 item.remarks
//               ])
//             ]
//           }
//         },
//         '\n',
//         { text: 'Signatures', style: 'subheader' },
//         {
//           columns: [
//             [
//               { text: 'Tenant Signature:', bold: true },
//               isValidDataUrl(reportData.tenantSignature)
//                 ? { image: reportData.tenantSignature, width: 120 }
//                 : 'No signature'
//             ],
//             [
//               { text: 'Technician Signature:', bold: true },
//               isValidDataUrl(reportData.technicianSignature)
//                 ? { image: reportData.technicianSignature, width: 120 }
//                 : 'No signature'
//             ]
//           ]
//         }
//       ],
//       styles: {
//         header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
//         subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
//       },
//       defaultStyle: {
//         font: 'Times'
//       },
//     };

//     // Generate PDF
//     const pdfDoc = printer.createPdfKitDocument(docDefinition);
//     const chunks = [];
//     pdfDoc.on('data', chunk => chunks.push(chunk));
//     pdfDoc.on('end', () => {
//       const pdfBuffer = Buffer.concat(chunks);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', 'attachment; filename=Checklist_Report.pdf');
//       res.send(pdfBuffer);
//     });
//     pdfDoc.end();
//   } catch (err) {
//     console.error('PDF generation error:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// app.get('/api/checklists-by-status', async (req, res) => {
//   try {
//     const db = await connectEstate(req.session.companyConfig); // Use your estate DB connection
//     const { status = '0' } = req.query;

//     let query = `
//       SELECT 
//         trno, srno, refNum, trdate, contract_id, t.both, t.CTenantName, b.build_id, b.build_desc, eh.unit_desc, visitType, contract_sdate, contract_edate,
//         preparedBy, verifiedBy, approvedBy, eh.authLevel, authStatus, eh.remarks, grandTotal, totalAmt, vatAmt, eh.userid, eh.sysdate
//       FROM estimationcost_header eh
//       INNER JOIN building b on eh.build_id = b.build_id
//       INNER JOIN tenant t on eh.both = t.both
//     `;
//     let params = [];

//     if (status !== '0') {
//       query += ' WHERE eh.authLevel = @authLevel';
//       params.push({ name: 'authLevel', type: sql.Int, value: parseInt(status) });
//     }
//     query += ' ORDER BY trdate DESC';

//     const request = db.request();
//     params.forEach(p => request.input(p.name, p.type, p.value));

//     const result = await request.query(query);

//     const formattedChecklists = result.recordset.map(item => ({
//       id: item.srno?.toString(),
//       submissionDate: item.trdate || item.sysdate || '',
//       visitType: item.visitType || '',
//       building: item.build_desc || '',
//       unit: item.unit_desc || '',
//       tenant: item.CTenantName || '',
//       contractNo: item.contract_id || '',
//       technician: item.userid || '',
//       startDate: item.contract_sdate || '',
//       endDate: item.contract_edate || '',
//       refNum: item.refNum || '',
//       equipment: [], // You can fetch equipment details if needed
//       authLevel: item.authLevel,
//       Trno: item.trno,
//       Srno: item.srno,
//       preparedBy: item.preparedBy,
//       verifiedBy: item.verifiedBy,
//       approvedBy: item.approvedBy,
//       remarks: item.remarks,
//       grandTotal: item.grandTotal,
//       totalAmt: item.totalAmt,
//       vatAmt: item.vatAmt
//     }));

//     res.json({ total: formattedChecklists.length, checklists: formattedChecklists });
//   } catch (err) {
//     console.error('Error fetching checklists by status:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

app.get('/api/checklists-by-status', async (req, res) => {
  try {
    const db = await connectEstate(req.session.companyConfig);
    const { status = '0' } = req.query;

    let query = `
      SELECT 
        eh.trno,
        eh.srno,
        eh.refNum,
        eh.trdate,
        eh.contract_id,
        eh.both,
        ISNULL(t.CTenantName, '') AS CTenantName,
        eh.build_id,
        ISNULL(b.build_desc, '') AS build_desc,
        eh.unit_desc,
        eh.visitType,
        eh.contract_sdate,
        eh.contract_edate,
        eh.preparedBy,
        eh.verifiedBy,
        eh.approvedBy,
        eh.authLevel,
        eh.authStatus,
        eh.remarks,
        eh.grandTotal,
        eh.totalAmt,
        eh.vatAmt,
        eh.userid,
        eh.sysdate
      FROM estimationcost_header eh
      LEFT JOIN building b ON eh.build_id = b.build_id
      LEFT JOIN tenant t ON eh.both = t.both
    `;

    if (status !== '0') {
      query += ' WHERE eh.authLevel = @authLevel';
    }

    query += ' ORDER BY eh.trdate DESC';

    const request = db.request();

    if (status !== '0') {
      request.input('authLevel', sql.Int, parseInt(status));
    }

    const result = await request.query(query);

    const formattedChecklists = result.recordset.map(item => ({
      id: item.srno?.toString(),
      submissionDate: item.trdate || item.sysdate || '',
      visitType: item.visitType || '',
      building: item.build_desc || '',
      unit: item.unit_desc || '',
      tenant: item.CTenantName || '',
      contractNo: item.contract_id || '',
      technician: item.userid || '',
      startDate: item.contract_sdate || '',
      endDate: item.contract_edate || '',
      refNum: item.refNum || '',
      equipment: [],
      authLevel: item.authLevel,
      Trno: item.trno,
      Srno: item.srno,
      preparedBy: item.preparedBy,
      verifiedBy: item.verifiedBy,
      approvedBy: item.approvedBy,
      remarks: item.remarks,
      grandTotal: item.grandTotal,
      totalAmt: item.totalAmt,
      vatAmt: item.vatAmt
    }));

    res.json({
      total: formattedChecklists.length,
      checklists: formattedChecklists
    });

  } catch (err) {
    console.error('Error fetching checklists by status:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


app.get('/api/checklistshistory', async (req, res) => {
  try {
    const db = await connectEstate(req.session.companyConfig);
    const {
      page = '1',
      filterType,
      filterDate,
      filterBuilding,
      filterUnit,
      filterTechnician,
      filterContractNo,
      orderBy = 'desc'
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSizeNum = 25; // force 25 per page
    const offset = (pageNum - 1) * pageSizeNum;

    let where = 'WHERE 1=1';
    if (filterType === 'date' && filterDate) where += ` AND CAST(sysdate AS DATE) = @filterDate`;
    if (filterBuilding) where += ` AND build_id LIKE @filterBuilding`;
    if (filterUnit) where += ` AND unit_desc LIKE @filterUnit`;
    if (filterTechnician) where += ` AND userid LIKE @filterTechnician`;
    if (filterContractNo) where += ` AND contract_id LIKE @filterContractNo`;

    const query = `
      SELECT *
      FROM (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY refNum ORDER BY sysdate DESC) AS rn
        FROM checklist
        ${where}
      ) t
      WHERE t.rn = 1
      ORDER BY sysdate ${orderBy === 'asc' ? 'ASC' : 'DESC'}
      OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT refNum) AS total
      FROM checklist
      ${where};
    `;

    // use separate requests
    const dataReq = db.request();
    const countReq = db.request();

    if (filterContractNo) {
      dataReq.input('filterContractNo', sql.NVarChar, `%${filterContractNo}%`);
      countReq.input('filterContractNo', sql.NVarChar, `%${filterContractNo}%`);
    }

    if (filterType === 'date' && filterDate) {
      dataReq.input('filterDate', sql.Date, filterDate);
      countReq.input('filterDate', sql.Date, filterDate);
    }
    if (filterBuilding) {
      dataReq.input('filterBuilding', sql.NVarChar, `%${filterBuilding}%`);
      countReq.input('filterBuilding', sql.NVarChar, `%${filterBuilding}%`);
    }
    if (filterUnit) {
      dataReq.input('filterUnit', sql.NVarChar, `%${filterUnit}%`);
      countReq.input('filterUnit', sql.NVarChar, `%${filterUnit}%`);
    }
    if (filterTechnician) {
      dataReq.input('filterTechnician', sql.NVarChar, `%${filterTechnician}%`);
      countReq.input('filterTechnician', sql.NVarChar, `%${filterTechnician}%`);
    }

    dataReq.input('offset', sql.Int, offset);
    dataReq.input('pageSize', sql.Int, pageSizeNum);

    const [result, countResult] = await Promise.all([
      dataReq.query(query),
      countReq.query(countQuery)
    ]);

    const checklists = result.recordset || [];
    const total = countResult.recordset?.[0]?.total || 0;

    const formattedChecklists = checklists.map(item => ({
      id: item.refNum,
      submissionDate: item.sysdate,
      visitType: item.visitType,
      building: item.build_id,
      buildingDesc: item.build_desc,
      unit: item.unit_desc,
      tenant: item.CTenantName,
      contractNo: item.contract_id,
      technician: item.userid,
      startDate: item.contract_sdate,
      endDate: item.contract_edate,
      refNum: item.refNum || '',
    }));

    res.json({
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
      checklists: formattedChecklists
    });
  } catch (err) {
    console.error('Error fetching checklists:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/checklistshistory-all', async (req, res) => {
  try {
    const db = await connectEstate(req.session.companyConfig);
    const {
      filterType,
      filterDate,
      filterBuilding,
      filterUnit,
      filterTechnician,
      filterContractNo,
      orderBy = 'desc'
    } = req.query;

    let where = 'WHERE 1=1';
    if (filterType === 'date' && filterDate) where += ` AND CAST(sysdate AS DATE) = @filterDate`;
    if (filterBuilding) where += ` AND build_id LIKE @filterBuilding`;
    if (filterUnit) where += ` AND unit_desc LIKE @filterUnit`;
    if (filterTechnician) where += ` AND userid LIKE @filterTechnician`;
    if (filterContractNo) where += ` AND contract_id LIKE @filterContractNo`;

    const query = `
      SELECT *
      FROM (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY refNum ORDER BY sysdate DESC) AS rn
        FROM checklist
        ${where}
      ) t
      WHERE t.rn = 1
      ORDER BY sysdate ${orderBy === 'asc' ? 'ASC' : 'DESC'};
    `;

    const request = db.request();
    if (filterType === 'date' && filterDate) request.input('filterDate', sql.Date, filterDate);
    if (filterBuilding) request.input('filterBuilding', sql.NVarChar, `%${filterBuilding}%`);
    if (filterUnit) request.input('filterUnit', sql.NVarChar, `%${filterUnit}%`);
    if (filterTechnician) request.input('filterTechnician', sql.NVarChar, `%${filterTechnician}%`);
    if (filterContractNo) request.input('filterContractNo', sql.NVarChar, `%${filterContractNo}%`);

    const result = await request.query(query);
    const checklists = result.recordset || [];
    const total = countResult.recordset[0]?.total || 0;

    const formattedChecklists = checklists.map(item => ({
      id: item.refNum,
      submissionDate: item.sysdate,
      visitType: item.visitType,
      building: item.build_id,
      build_desc: item.build_desc,
      unit: item.unit_desc,
      unitType: item.unitType,
      unitNature: item.unitNature,
      emirates: item.placeDesc,
      tenant: item.CTenantName,
      contractNo: item.contract_id,
      technician: item.userid,
      startDate: item.contract_sdate,
      endDate: item.contract_edate,
      refNum: item.refNum || '',
      technicianSignature: item.technicianSignature,
      tenantSignature: item.tenantSignature,
      equipment: equipmentMap[item.refNum] || []
    }));

    res.json({
      total: formattedChecklists.length,
      checklists: formattedChecklists
    });
  } catch (err) {
    console.error('Error fetching all checklist history:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/checklistDetails', async (req, res) => {
  try{
    const {refNum} = req.query;
    const db = await connectEstate(req.session.companyConfig);
    const query = `SELECT c.contract_id, c.build_id, b.build_desc, c.unit_desc,	c.contract_sdate,	c.contract_edate,	
    c.barcode, c.counter,	c.refNum,	c.visitType, t.both, c.CTenantName,	c.tenantSignature, c.technicianSignature,	
    c.itemno,	c.itemname,	c.brdcode, c.subcode, c.unit, c.qty, c.status,	c.remarks, c.userid, c.sysdate
    FROM checklist c 
    INNER JOIN building b on c.build_id = b.build_id
    INNER JOIN tenant t on c.both = t.both
    WHERE c.refNum = @refNum ORDER BY c.sysdate DESC`;
    const request = db.request();
    request.input('refNum', sql.NVarChar, refNum);
    const result = await request.query(query);
    const checklistDetails = result.recordset || [];

    const imagesRequest = db.request();
    imagesRequest.input('refNum', sql.NVarChar, refNum);
    const imagesResult = await imagesRequest.query(`
      SELECT id FROM checklist_images WHERE refNum = @refNum
    `);
    const imageIds = imagesResult.recordset.map(row => row.id);

    const checklistDetailsWithImages = checklistDetails.map(detail => ({
      ...detail,
      images: imageIds
    }));

    res.json({ total: checklistDetails.length, checklistDetails: checklistDetailsWithImages });
  }catch(err){
    console.error('Error fetching checklist details:', err);
    res.status(500).json({ success: false, error: err.message });
}
});

app.get('/api/checklist-image/:id', async (req, res) => {
  try {
    const db = await connectEstate(req.session.companyConfig);
    const { id } = req.params;
    const request = db.request();
    request.input('id', sql.Int, parseInt(id, 10));
    const result = await request.query(`
      SELECT TOP 1 image, mimetype
      FROM checklist_images
      WHERE id = @id
    `);

    if (!result.recordset.length) {
      return res.status(404).send('Image not found');
    }

    const row = result.recordset[0];
    res.set('Content-Type', row.mimetype || 'image/jpeg');
    res.send(row.image);// This is the actual image binary
  } catch (err) {
    console.error('Error serving checklist image:', err);
    res.status(500).send('Server error');
  }
});


app.get('/api/tenant-details/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const db = await connectEstate(req.session.companyConfig);
    const request = db.request();

    // 1. Get tenant by CTenantName
    request.input('username', sql.NVarChar, username);
    const tenantResult = await request.query(`
      SELECT TOP 1 * FROM tenant WHERE CTenantName = @username
    `);
    if (!tenantResult.recordset.length) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    const tenant = tenantResult.recordset[0];

    // 2. Get latest contract for this tenant (by tena_id/both)
    request.input('both', sql.NVarChar, tenant.both);
    const contractResult = await request.query(`
      SELECT TOP 1 * FROM contract WHERE tena_id = @both ORDER BY contract_sdate DESC
    `);
    if (!contractResult.recordset.length) {
      return res.status(404).json({ message: 'Contract not found for tenant' });
    }
    const contractDoc = contractResult.recordset[0];

    // 3. Get building info
    request.input('build_id', sql.NVarChar, contractDoc.build_id);
    const buildingResult = await request.query(`
      SELECT TOP 1 * FROM building WHERE build_id = @build_id
    `);
    const building = buildingResult.recordset[0];

    // 4. Get unit info
    request.input('unit_desc', sql.NVarChar, contractDoc.unit_desc);
    const unitResult = await request.query(`
      SELECT TOP 1 * FROM unit WHERE build_id = @build_id AND unit_desc = @unit_desc
    `);
    const unit = unitResult.recordset[0];

    res.json({
      both: tenant.both,
      CTenantName: tenant.CTenantName,
      contract_id: contractDoc.contract_id,
      build_id: contractDoc.build_id,
      build_desc: building ? building.build_desc : '',
      unit_desc: contractDoc.unit_desc,
      unit_master_desc: unit ? unit.unit_master_desc : '',
      contract_sdate: contractDoc.contract_sdate,
      contract_edate: contractDoc.contract_edate,
      tena_city: tenant.tena_city,
      tena_email: tenant.tena_email,
      tena_mobile: tenant.tena_mobile
    });
  } catch (err) {
    console.error('Error fetching tenant details:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/complaints',
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 10 }
  ]),
  async (req, res) => {
    try {
      const db = await connect();

      // console.log('Received body:', req.body);

      // Robust equipment parsing
      let equipment = [];
      if (typeof req.body.equipment === 'string') {
        try {
          equipment = JSON.parse(req.body.equipment);
        } catch {
          equipment = [];
        }
      } else if (Array.isArray(req.body.equipment)) {
        equipment = req.body.equipment;
      }

      // Prepare complaint document (without files yet)
      const complaintDoc = {
        building: req.body.building,
        unit: req.body.unit,
        tenant: req.body.tenant,
        contractNo: req.body.contractNo,
        startDate: req.body.startDate && !isNaN(Date.parse(req.body.startDate)) ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate && !isNaN(Date.parse(req.body.endDate)) ? new Date(req.body.endDate) : null,
        submissionDate: req.body.submissionDate && !isNaN(Date.parse(req.body.submissionDate))
          ? new Date(req.body.submissionDate)
          : new Date(),
        description: req.body.description,
        username: req.body.username,
        status: req.body.status || 'pending',
        equipment,
        both: req.body.both,
        build_id: req.body.build_id,
        unit_desc: req.body.unit_desc,
        referenceNumber: req.body.referenceNumber || '',
        createdAt: new Date(),
        // files: []
      };

      const result = await db.collection('dbo.complaints').insertOne(complaintDoc);
      const complaintId = result.insertedId;

      // Setup GridFS bucket
      const bucket = new GridFSBucket(db, { bucketName: 'checklist_files' });

     // ...inside your /api/complaints endpoint...
      const files = [
        ...((req.files && req.files.images) ? req.files.images.map(f => ({ ...f, type: 'image' })) : []),
        ...((req.files && req.files.videos) ? req.files.videos.map(f => ({ ...f, type: 'video' })) : [])
      ];

      for (const file of files) {
        // console.log(`Uploading file: ${file.originalname}, type: ${file.type}, size: ${file.size} bytes`);
        const uploadStream = bucket.openUploadStream(file.originalname, {
          contentType: file.mimetype,
          metadata: {
            complaint_id: complaintId,
            type: file.type
          }
        });

        uploadStream.end(file.buffer);

        // Wait for the upload to finish before continuing
        await new Promise((resolve, reject) => {
         uploadStream.on('finish', async () => {
  // console.log(`Saved to GridFS: ${uploadStream.id}`); // Only _id is available here
  await db.collection('dbo.complaints').updateOne(
    { _id: complaintId },
    {
      $push: {
        files: {
          file_id: uploadStream.id,
          file_name: file.originalname,
          file_type: file.type,
          mime_type: file.mimetype
        }
      }
    }
  );
  resolve();
});
          uploadStream.on('error', reject);
        });
      }

      res.json({ success: true, id: complaintId });
    } catch (err) {
      console.error('Error saving complaint:', err);
      res.status(500).json({ success: false, message: 'Failed to save complaint', error: err.message });
    }
  }
);

// app.get('/api/complaints', async (req, res) => {
//   try {
//     const { tenant } = req.query;
//     const db = await connectEstate(req.session.companyConfig); // Use your estate DB connection

//     // Build query and parameters
//     let query = `
//       SELECT c.*, f.id AS file_id, f.file_name, f.file_type, f.mime_type
//       FROM complaints c
//       LEFT JOIN complaint_files f ON c.id = f.complaint_id
//     `;
//     let params = [];
//     if (tenant) {
//       query += ' WHERE c.tenant = @tenant';
//       params.push({ name: 'tenant', type: sql.NVarChar, value: tenant });
//     }

//     const request = db.request();
//     params.forEach(p => request.input(p.name, p.type, p.value));
//     const result = await request.query(query);

//     // Group files by complaint
//     const complaintsMap = {};
//     for (const row of result.recordset) {
//       if (!complaintsMap[row.id]) {
//         complaintsMap[row.id] = {
//           ...row,
//           files: []
//         };
//       }
//       if (row.file_id) {
//         complaintsMap[row.id].files.push({
//           file_id: row.file_id,
//           file_name: row.file_name,
//           file_type: row.file_type,
//           mime_type: row.mime_type,
//           url: `/api/complaint-image/${row.file_id}`
//         });
//       }
//     }

//     // Convert map to array
//     const complaints = Object.values(complaintsMap);

//     res.json(complaints);
//   } catch (err) {
//     console.error('Error fetching complaints:', err);
//     res.status(500).json({ success: false, message: 'Failed to fetch complaints', error: err.message });
//   }
// });
 
app.get('/api/complaint-image/:id', async (req, res) => {
  try {
    const db = await connect();
    const bucket = new GridFSBucket(db, { bucketName: 'checklist_files' });
    const fileId = new ObjectId(req.params.id);

    // Find the file to get its contentType
    const files = await db.collection('checklist_files.files').find({ _id: fileId }).toArray();
    if (!files.length) {
      // console.log('File not found in GridFS for id:', fileId);
      return res.status(404).send('File not found');
    }

    res.set('Content-Type', files[0].contentType);

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on('error', (err) => {
      // console.log('Download stream error:', err);
      res.status(404).send('File not found');
    });
    downloadStream.pipe(res);
  } catch (err) {
    console.error('Server error in /api/complaint-image/:id:', err);
    res.status(500).send('Server error');
  }
});

// Check if checklist has existing estimation cost
app.get('/api/check-estimation-exists/:refNum', async (req, res) => {
  try {
    const db = await connectEstate(req.session.companyConfig);
    const { refNum } = req.params;
    
    // Find estimation with this RefNum that is not rejected (AuthLevel not 3 or 5)
    const request = db.request();
    request.input('refNum', sql.NVarChar, refNum);
    const result = await request.query(`
      SELECT TOP 1 srno, authLevel, authStatus
      FROM estimationcost_header
      WHERE RefNum = @refNum AND AuthLevel NOT IN (3, 5)
    `);
    const existingEstimation = result.recordset[0];

    res.json({
      success: true,
      exists: !!existingEstimation,
      estimation: existingEstimation
        ? {
            Srno: existingEstimation.srno,
            AuthLevel: existingEstimation.authLevel,
            AuthStatus: existingEstimation.authStatus,
          }
        : null,
    });
  } catch (err) {
    console.error('Error checking estimation exists:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

//check if checklist has existing estimation cost is approved
app.get('/api/check-estimation-approved/:refNum', async (req, res) => {
  try {
    const db = await connectEstate(req.session.companyConfig);
    const { refNum } = req.params;
    
    // Find estimation with this RefNum that is approved (AuthLevel 3 or 5)
    const request = db.request();
    request.input('refNum', sql.NVarChar, refNum);
    const result = await request.query(`
      SELECT TOP 1 srno, authLevel, authStatus
      FROM estimationcost_header
      WHERE authStatus = 'Approved' AND RefNum = @refNum 
    `);
//     console.log('Checking estimation for RefNum:', refNum);
// console.log('SQL result:', result.recordset);
    const existingEstimation = result.recordset[0];

    res.json({
      success: true,
      exists: !!existingEstimation,
      estimation: existingEstimation
        ? {
            Srno: existingEstimation.srno,
            AuthLevel: existingEstimation.authLevel,
            AuthStatus: existingEstimation.authStatus,
          }
        : null,
    });
  } catch (err) {
    console.error('Error checking estimation exists:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// Search estimation costs by reference number
// app.get('/api/search-estimations', async (req, res) => {
//   try {
//     const db = await connectEstate(req.session.companyConfig); // Use your estate DB connection
//     const { search } = req.query;

//     let query = `
//       SELECT TOP 50
//         Srno,
//         Trno,
//         RefNum,
//         t.CTenantName,
//         b.build_desc,
//         unit_desc,
//         AuthStatus,
//         TrDate
//       FROM estimationcost_header eh
//       INNER JOIN building b on eh.build_id = b.build_id
//       INNER JOIN tenant t on eh.both = t.both
//       WHERE 1=1
//     `;

//     if (search) {
//       query += ' AND RefNum LIKE @search';
//     }

//     query += ' ORDER BY TrDate DESC';

//     const request = db.request();
//     if (search) {
//       request.input('search', sql.NVarChar, `%${search}%`);
//     }

//     const result = await request.query(query);

//     const formatted = result.recordset.map(est => ({
//       Srno: est.Srno,
//       Trno: est.Trno,
//       RefNum: est.RefNum,
//       TenantName: est.TenantName,
//       building_id: est.building_id,
//       unit_desc: est.unit_desc,
//       AuthStatus: est.AuthStatus,
//       TrDate: est.TrDate
//     }));

//     res.json({ success: true, estimations: formatted });
//   } catch (err) {
//     console.error('Error searching estimations:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

app.get('/api/search-estimations', async (req, res) => {
  try {
    const db = await connectEstate(req.session.companyConfig);
    const { search } = req.query;

    let query = `
      SELECT TOP 50
        eh.Srno,
        eh.Trno,
        eh.RefNum,
        ISNULL(t.CTenantName, '') AS TenantName,
        ISNULL(b.build_desc, '') AS build_desc,
        eh.unit_desc,
        eh.AuthStatus,
        eh.TrDate
      FROM estimationcost_header eh
      LEFT JOIN building b ON eh.build_id = b.build_id
      LEFT JOIN tenant t ON eh.both = t.both
      WHERE 1=1
    `;

    if (search) {
      query += ` 
        AND (
          eh.RefNum LIKE @search
          OR eh.Trno LIKE @search
          OR t.CTenantName LIKE @search
        )
      `;
    }

    query += ' ORDER BY eh.TrDate DESC';

    const request = db.request();

    if (search) {
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    const result = await request.query(query);

    const formatted = result.recordset.map(est => ({
      Srno: est.Srno,
      Trno: est.Trno,
      RefNum: est.RefNum,
      TenantName: est.TenantName,
      build_desc: est.build_desc,
      unit_desc: est.unit_desc,
      AuthStatus: est.AuthStatus,
      TrDate: est.TrDate
    }));

    res.json({ success: true, estimations: formatted });

  } catch (err) {
    console.error('Error searching estimations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


app.post('/api/generate-checklist-pdf', async (req, res) => {
  const { reportData, selectedEquipment, username, barcodeBase64 } = req.body;

  // helper: validate existing data URL images
  const isValidDataUrl = (str) =>
    typeof str === 'string' && /^data:image\/(png|jpeg|jpg);base64,/.test(str);

  // helper: fetch a remote/internal image and return a data URL
  async function fetchImageToDataUrl(url) {
    try {
      // node 18+ has global fetch; fallback to node-fetch if not present
      const _fetch = (typeof fetch !== 'undefined') ? fetch : (await import('node-fetch')).default;
      const resp = await _fetch(url);
      if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
      const buffer = await resp.arrayBuffer();
      const contentType = resp.headers.get('content-type') || 'image/png';
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:${contentType};base64,${base64}`;
    } catch (err) {
      console.warn('fetchImageToDataUrl error for', url, err.message);
      return null;
    }
  }

  try {
    // Read logo as base64 (existing)
    const logoPath = path.join(__dirname, 'assets', 'header.png');
    let logoBase64 = '';
    try {
      logoBase64 = fs.readFileSync(logoPath).toString('base64');
    } catch (e) {
      logoBase64 = '';
    }

    // Prepare image data URLs for any uploaded images included in reportData.images
    const images = Array.isArray(reportData.images) ? reportData.images : [];
    const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;

    const imageDataUrls = [];
    for (const img of images) {
      try {
        // already a data url
        if (typeof img === 'string' && isValidDataUrl(img)) {
          imageDataUrls.push(img);
          continue;
        }

        // object with url
        if (img && typeof img === 'object' && img.url) {
          const fullUrl = img.url.startsWith('http') ? img.url : (img.url.startsWith('/') ? `${baseUrl}${img.url}` : `${baseUrl}/${img.url}`);
          const dataUrl = await fetchImageToDataUrl(fullUrl);
          if (dataUrl) imageDataUrls.push(dataUrl);
          continue;
        }

        // object with file_id (GridFS)
        if (img && typeof img === 'object' && img.file_id) {
          const fileId = String(img.file_id);
          const fullUrl = `${baseUrl}/api/complaint-image/${fileId}`;
          const dataUrl = await fetchImageToDataUrl(fullUrl);
          if (dataUrl) imageDataUrls.push(dataUrl);
          continue;
        }

        // string path (relative) like /api/complaint-image/{id} or full url
        if (typeof img === 'string') {
          const fullUrl = img.startsWith('http') ? img : (img.startsWith('/') ? `${baseUrl}${img}` : `${baseUrl}/${img}`);
          const dataUrl = await fetchImageToDataUrl(fullUrl);
          if (dataUrl) imageDataUrls.push(dataUrl);
          continue;
        }

        // Blob/File not supported server-side in this request
      } catch (err) {
        console.warn('Image processing failed for entry', img, err.message);
      }
    }

    // --- Date formatting helpers (existing) ---
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    const formatDateTime = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // --- Equipment table body (existing) ---
    // console.log(reportData.equipment)
    const equipmentTableBody = [
      [
        { text: 'SI No', style: 'tableHeader', alignment: 'center' },
        { text: 'Item Name', style: 'tableHeader', alignment: 'left' },
        { text: 'Unit', style: 'tableHeader', alignment: 'center' },
        { text: 'QTY', style: 'tableHeader', alignment: 'center' },
        { text: 'Status', style: 'tableHeader', alignment: 'center' },
        { text: 'Remarks', style: 'tableHeader', alignment: 'left' }
      ],
      ...(Array.isArray(reportData.equipment) ? reportData.equipment.map((item, idx) => ([
        { text: idx + 1, alignment: 'center', style: 'infoValue' },
        { text: item.itemname || '', alignment: 'left', style: 'infoValue' },
        { text: item.unit || '', alignment: 'center', style: 'infoValue' },
        { text: item.qty != null ? String(item.qty) : '', alignment: 'center', style: 'infoValue' },
        { text: item.status || '', alignment: 'center', style: 'infoValue' },
        { text: item.remarks || '', alignment: 'left', style: 'infoValue' }
      ])) : [])
    ];

    // --- Build PDF docDefinition (existing + images insertion) ---
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 50],
      defaultStyle: { font: 'Times' },
      content: [
        // Logo/Header
        logoBase64
          ? {
            image: 'data:image/png;base64,' + logoBase64,
            width: 500,
            margin: [0, 0, 0, 10]
          }
          : {},
        // Title + barcode (existing)
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              text: 'Checklist Report',
              style: 'header',
              alignment: 'center',
              margin: [0, 0, 0, 4]
            },
            barcodeBase64
              ? {
                width: 'auto',
                image: barcodeBase64,
                fit: [180, 40],
                alignment: 'right',
                margin: [0, 0, 0, 10]
              }
              : { width: 'auto', text: '' }
          ]
        },
        {
          columns: [
            {
              width: '*',
              text: [
                { text: 'Reference No: ', bold: true, fontSize: 11 },
                { text: reportData.Reference || '', bold: true, fontSize: 11 }
              ],
              margin: [0, 10, 0, 10]
            }
          ]
        },
        // Info table (existing)
        {
          table: {
            widths: [70, '*', 70, '*'],
            body: [
              [
                { text: 'Tenant', bold: true, style: 'tableHeader' },
                { text: reportData.tenant || '', colSpan: 3, style: 'infoValue' }, '', ''
              ],
              [
                { text: 'Building', bold: true, style: 'tableHeader' },
                { text: reportData.building || '', colSpan: 3, style: 'infoValue' }, '', ''
              ],
              [
                { text: 'Date', bold: true, style: 'tableHeader' }, { text: formatDateTime(reportData.submissionDate) || '', style: 'infoValue' },
                { text: 'Visit Type', bold: true, style: 'tableHeader' }, { text: reportData.visitType || '', bold: true, style: 'infoValue' }
              ],
              [
                { text: 'Contract No', bold: true, style: 'tableHeader' }, { text: reportData.contractNo || '', style: 'infoValue' },
                { text: 'Unit', bold: true, style: 'tableHeader' }, { text: reportData.unit || '', style: 'infoValue' }
              ],
              [
                { text: 'Start', bold: true, style: 'tableHeader' }, { text: formatDate(reportData.startDate) || '', style: 'infoValue' },
                { text: 'End', bold: true, style: 'tableHeader' }, { text: formatDate(reportData.endDate) || '', style: 'infoValue' }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#000',
            vLineColor: () => '#000'
          },
          margin: [0, 0, 0, 10]
        },
        // Equipment Table (existing)
        { text: 'Equipment Status:', style: 'subHeader', margin: [0, 10, 0, 4] },
        {
          table: {
            headerRows: 1,
            widths: [30, '*', 40, 30, 40, '*'],
            body: equipmentTableBody,
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#000',
            vLineColor: () => '#000'
          }
        },
      ],
      footer: function (currentPage, pageCount) {
        return {
          margin: [40, 0, 40, 0],
          columns: [
            { text: `Printed By: ${username} ${formatDateTime(new Date())}`, alignment: 'left', fontSize: 8 },
            { text: `Page ${currentPage} of ${pageCount}`, alignment: 'right', fontSize: 8 }
          ]
        };
      },
      styles: {
        header: { fontSize: 12, bold: true },
        subHeader: { fontSize: 8, bold: true },
        tableHeader: { bold: true, fontSize: 9, color: 'black' },
        infoValue: { fontSize: 10 }
      }
    };

    // If we have image data URLs, insert them after the equipment table
    if (imageDataUrls.length) {
      docDefinition.content.push({ text: '\nAttached Images:', style: 'subHeader', margin: [0, 10, 0, 4] });

      // chunk into rows of 3 images per row
      const chunkSize = 3;
      for (let i = 0; i < imageDataUrls.length; i += chunkSize) {
        const chunk = imageDataUrls.slice(i, i + chunkSize);
        const cols = chunk.map(dataUrl => ({
          image: dataUrl,
          fit: [180, 120],
          margin: [2, 2, 2, 2]
        }));
        // pad empty columns to keep layout consistent
        while (cols.length < chunkSize) cols.push({ text: '' });
        docDefinition.content.push({ columns: cols, margin: [0, 4, 0, 4] });
      }
    }

    // Signatures section (existing)
    docDefinition.content.push({
      columns: [
        {
          width: '*',
          stack: [
            { text: 'ACCEPTED BY:', bold: true, alignment: 'left', fontSize: 11, margin: [0, 20, 0, 2] },
            { text: reportData.tenant || '', alignment: 'left', fontSize: 10, margin: [0, 0, 0, 8] },
            {
              alignment: 'left',
              stack: [
                {
                  canvas: [
                    { type: 'rect', x: 0, y: 0, w: 120, h: 60, r: 8, lineWidth: 2, lineColor: '#000' }
                  ]
                },
                isValidDataUrl(reportData.tenantSignature)
                  ? { image: reportData.tenantSignature, width: 100, height: 40, margin: [10, -50, 0, 0] }
                  : ''
              ],
              margin: [0, 0, 0, 0]
            }
          ]
        },
        {
          width: '*',
          stack: [
            { text: 'PREPARED BY:', bold: true, alignment: 'right', fontSize: 11, margin: [0, 20, 0, 2] },
            { text: username || '', alignment: 'right', fontSize: 10, margin: [0, 0, 0, 8] },
            {
              alignment: 'right',
              stack: [
                {
                  canvas: [
                    { type: 'rect', x: 0, y: 0, w: 120, h: 60, r: 8, lineWidth: 2, lineColor: '#000' }
                  ]
                },
                isValidDataUrl(reportData.technicianSignature)
                  ? { image: reportData.technicianSignature, width: 100, height: 40, margin: [10, -50, 0, 0] }
                  : ''
              ],
              margin: [0, 0, 0, 0]
            }
          ]
        }
      ]
    });

    // Generate PDF with fonts included (existing)
    const printerInstance = new PdfPrinter({
      Times: {
        normal: path.join(__dirname, 'fonts', 'times.ttf'),
        bold: path.join(__dirname, 'fonts', 'TimesBold.ttf'),
        italics: path.join(__dirname, 'fonts', 'TimesItalic.ttf'),
        bolditalics: path.join(__dirname, 'fonts', 'TimesBoldItalic.ttf')
      }
    });
    const pdfDoc = printerInstance.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Checklist_Report.pdf');
    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (err) {
    console.error('PDF generation error (with images):', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// app.get('/api/estimation-cost/:srno', async (req, res) => {
//   const { srno } = req.params;
//   try {
//     const db = await connectEstate(req.session.companyConfig); // Use your estate DB connection

//     // Fetch header
//     const headerRequest = db.request();
//     headerRequest.input('srno', sql.Int, srno);
//     const headerResult = await headerRequest.query(`
//       SELECT trno, srno, refNum, contract_id, t.CTenantName, b.build_desc, eh.unit_desc, eh.sysdate, eh.visitType, 
//       eh.contract_sdate, eh.contract_edate, preparedBy, verifiedBy, approvedBy, eh.authLevel, eh.authStatus, eh.remarks
//       FROM estimationcost_header eh
//       INNER JOIN building b on eh.build_id = b.build_id
//       INNER JOIN tenant t on eh.both = t.both
//       WHERE Srno = @srno
//     `);

//     if (!headerResult.recordset.length) {
//       return res.status(404).json({ success: false, error: 'Estimation cost not found' });
//     }
//     const header = headerResult.recordset[0];

//     // Fetch equipment details
//     const equipmentRequest = db.request();
//     equipmentRequest.input('srno', sql.Int, srno);
//     const equipmentResult = await equipmentRequest.query(`
//       SELECT *
//       FROM estimationcost_details
//       WHERE Srno = @srno
//       ORDER BY counter ASC
//     `);
//     const equipment = equipmentResult.recordset;

//     res.json({
//       success: true,
//       header,
//       equipment
//     });
//   } catch (err) {
//     console.error('Error fetching estimation cost:', err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

app.get('/api/estimation-cost/:srno', async (req, res) => {
  const { srno } = req.params;

  try {
    const db = await connectEstate(req.session.companyConfig);

    // 🔹 Fetch header
    const headerRequest = db.request();
    headerRequest.input('srno', sql.Int, srno);

    const headerResult = await headerRequest.query(`
      SELECT 
        eh.trno,
        eh.srno,
        eh.refNum,
        eh.contract_id,
        ISNULL(t.CTenantName, '') AS CTenantName,
        ISNULL(b.build_desc, '') AS build_desc,
        eh.unit_desc,
        eh.sysdate,
        eh.visitType,
        eh.contract_sdate,
        eh.contract_edate,
        eh.preparedBy,
        eh.verifiedBy,
        eh.approvedBy,
        eh.authLevel,
        eh.authStatus,
        eh.remarks
      FROM estimationcost_header eh
      LEFT JOIN building b ON eh.build_id = b.build_id
      LEFT JOIN tenant t ON eh.both = t.both
      WHERE eh.Srno = @srno
    `);

    if (!headerResult.recordset.length) {
      return res.status(404).json({ success: false, error: 'Estimation cost not found' });
    }

    const header = headerResult.recordset[0];

    // 🔹 Fetch equipment details
    const equipmentRequest = db.request();
    equipmentRequest.input('srno', sql.Int, srno);

    const equipmentResult = await equipmentRequest.query(`
      SELECT *
      FROM estimationcost_details
      WHERE Srno = @srno
      ORDER BY counter ASC
    `);

    const equipment = equipmentResult.recordset;

    res.json({
      success: true,
      header,
      equipment
    });

  } catch (err) {
    console.error('Error fetching estimation cost:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/save-estimation-cost', async (req, res) => {
  const { header, equipment, srno } = req.body;

  //console.log('Received estimation cost save request. Header:', header, 'Equipment:', equipment, 'Srno:', srno);

  if (!header || !Array.isArray(equipment)) {
    return res.status(400).json({ success: false, error: 'Missing header or equipment array' });
  }

  try {
    const db = await connectEstate(req.session.companyConfig);
    const username = req.session.user?.username || 'system';

    if (srno) {
      // UPDATE existing header
      // const updateHeaderQuery = `
      //   UPDATE estimationcost_header SET
      //     contract_id = @contract_no,
      //     CTenantName = @TenantName,
      //     building_id = @building_id,
      //     unit_desc = @unit_desc,
      //     date = @date,
      //     VisitType = @VisitType,
      //     contract_sdate = @contract_sdate,
      //     contract_edate = @contract_edate,
      //     RefNum = @RefNum,
      //     Userid = @Userid,
      //     TrDate = @TrDate
      //   WHERE Srno = @Srno
      // `;
      // const headerRequest = db.request();
      // headerRequest.input('contract_no', sql.NVarChar, header.contractNo);
      // headerRequest.input('TenantName', sql.NVarChar, header.tenant);
      // headerRequest.input('building_id', sql.NVarChar, header.building);
      // headerRequest.input('unit_desc', sql.NVarChar, header.unitNo);
      // headerRequest.input('date', sql.NVarChar, header.date);
      // headerRequest.input('VisitType', sql.NVarChar, header.visitType);
      // headerRequest.input('contract_sdate', sql.NVarChar, header.start);
      // headerRequest.input('contract_edate', sql.NVarChar, header.end);
      // headerRequest.input('RefNum', sql.NVarChar, header.reference);
      // headerRequest.input('Userid', sql.NVarChar, username);
      // headerRequest.input('TrDate', sql.NVarChar, getDubaiDateTimeString());
      // headerRequest.input('Srno', sql.Int, srno);
      // await headerRequest.query(updateHeaderQuery);

      // Delete old details
      const deleteDetailsRequest = db.request();
      deleteDetailsRequest.input('Srno', sql.Int, srno);
      await deleteDetailsRequest.query('DELETE FROM estimationcost_details WHERE Srno = @Srno');

      // Insert new details
      for (let idx = 0; idx < equipment.length; idx++) {
        const item = equipment[idx];
        const amt = parseFloat(item.amt) || 0;
        const qty = parseFloat(item.qty) || 1;
        const retprice = qty > 0 ? amt / qty : 0;
        const taxValue = amt * 0.05;
        const amtTotalWithTax = amt + taxValue;

        const insertDetailRequest = db.request();
        insertDetailRequest.input('Srno', sql.Int, srno);
        insertDetailRequest.input('counter', sql.Int, idx + 1);
        insertDetailRequest.input('itemno', sql.NVarChar, item.itemno);
        insertDetailRequest.input('itemname', sql.NVarChar, item.itemname);
        insertDetailRequest.input('unit', sql.NVarChar, item.unit);
        insertDetailRequest.input('qty', sql.Float, item.qty);
        insertDetailRequest.input('retprice', sql.Float, retprice);
        insertDetailRequest.input('amt', sql.Float, amt);
        insertDetailRequest.input('taxValue', sql.Float, taxValue);
        insertDetailRequest.input('amtTotalWithTax', sql.Float, amtTotalWithTax);
        insertDetailRequest.input('status', sql.NVarChar, item.status);
        insertDetailRequest.input('remarks', sql.NVarChar, item.remarks);
        await insertDetailRequest.query(`
          INSERT INTO estimationcost_details
            (srno, counter, itemno, itemname, unit, qty, retprice, amt, taxValue, amtTotalWithTax, status, remarks)
          VALUES
            (@Srno, @counter, @itemno, @itemname, @unit, @qty, @retprice, @amt, @taxValue, @amtTotalWithTax, @status, @remarks)
        `);
      }

      // Audit Log
      // await createAuditLog({
      //   module: 'Estimation Cost',
      //   action: 'UPDATE',
      //   referenceId: header.reference,
      //   referenceField: 'RefNum',
      //   username,
      // });

      res.json({ success: true, message: 'Estimation cost updated', srno });
    } else {
      // INSERT new header
      const trno = await GetNextTransactionNo('EstimationCost', req.session.companyConfig);
      const newSrno = await GetNextSerialNo('EstimationCost', req.session.companyConfig);

    // for (const [key, value] of Object.entries(header)) {
    //   if (typeof value === 'string') {
    //     console.log(`${key}: length=${value.length}, value=${value}`);
    //   }
    // }

      const insertHeaderRequest = db.request();
      insertHeaderRequest.input('trno', sql.Int, trno);
      insertHeaderRequest.input('srno', sql.Int, newSrno);
      insertHeaderRequest.input('refNum', sql.NVarChar, header.reference);
      insertHeaderRequest.input('trdate', sql.NVarChar, getDubaiDateTimeString());
      insertHeaderRequest.input('userid', sql.NVarChar, username);
      insertHeaderRequest.input('contract_id', sql.NVarChar, header.contractNo);
      insertHeaderRequest.input('both', sql.NVarChar, header.tenantid);
      insertHeaderRequest.input('build_id', sql.NVarChar, header.building);
      insertHeaderRequest.input('unit_desc', sql.NVarChar, header.unitNo);
      insertHeaderRequest.input('sysdate', sql.NVarChar, header.date);
      insertHeaderRequest.input('visitType', sql.NVarChar, header.visitType);
      insertHeaderRequest.input('contract_sdate', sql.NVarChar, header.start);
      insertHeaderRequest.input('contract_edate', sql.NVarChar, header.end);
      insertHeaderRequest.input('preparedBy', sql.NVarChar, username);
      insertHeaderRequest.input('verifiedBy', sql.NVarChar, '');
      insertHeaderRequest.input('approvedBy', sql.NVarChar, '');
      insertHeaderRequest.input('authLevel', sql.Int, 1);
      insertHeaderRequest.input('authStatus', sql.NVarChar, 'Awaiting for Verification');
      await insertHeaderRequest.query(`
        INSERT INTO estimationcost_header
          (trno, srno, refNum, trdate, userid, contract_id, both, build_id, unit_desc, 
          sysdate, visitType, contract_sdate, contract_edate, preparedBy, verifiedBy, approvedBy, 
          authLevel, authStatus)
        VALUES
          (@Trno, @Srno, @RefNum, @TrDate, @Userid, @contract_id, @both, @build_id, @unit_desc, 
          @sysdate, @visitType, @contract_sdate, @contract_edate, @preparedBy, @verifiedBy, @approvedBy, 
          @authLevel, @authStatus)
      `);

      // Insert details
      for (let idx = 0; idx < equipment.length; idx++) {
        const item = equipment[idx];
        const amt = parseFloat(item.amt) || 0;
        const qty = parseFloat(item.qty) || 1;
        const retprice = qty > 0 ? amt / qty : 0;
        const taxValue = amt * 0.05;
        const amtTotalWithTax = amt + taxValue;

        const insertDetailRequest = db.request();
        insertDetailRequest.input('Srno', sql.Int, newSrno);
        insertDetailRequest.input('counter', sql.Int, idx + 1);
        insertDetailRequest.input('itemno', sql.NVarChar, item.itemno);
        insertDetailRequest.input('itemname', sql.NVarChar, item.itemname);
        insertDetailRequest.input('unit', sql.NVarChar, item.unit);
        insertDetailRequest.input('qty', sql.Float, item.qty);
        insertDetailRequest.input('retprice', sql.Float, retprice);
        insertDetailRequest.input('amt', sql.Float, amt);
        insertDetailRequest.input('taxValue', sql.Float, taxValue);
        insertDetailRequest.input('amtTotalWithTax', sql.Float, amtTotalWithTax);
        insertDetailRequest.input('status', sql.NVarChar, item.status);
        insertDetailRequest.input('remarks', sql.NVarChar, item.remarks);
        await insertDetailRequest.query(`
          INSERT INTO estimationcost_details
            (srno, counter, itemno, itemname, unit, qty, retprice, amt, taxValue, amtTotalWithTax, status, remarks)
          VALUES
            (@Srno, @counter, @itemno, @itemname, @unit, @qty, @retprice, @amt, @taxValue, @amtTotalWithTax, @status, @remarks)
        `);
      }

      // Audit Log
      // await createAuditLog({
      //   module: 'Estimation Cost',
      //   action: 'CREATE',
      //   referenceId: header.reference,
      //   referenceField: 'RefNum',
      //   username
      // });

      res.json({ success: true, message: 'Estimation cost created', srno: newSrno });
    }
  } catch (err) {
    console.error('Error saving estimation cost:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get auth transitions for a specific module
app.get('/api/auth-transitions', async (req, res) => {
  try {
    const db = await connectEstate(req.session.companyConfig);
    const { module } = req.query;

    let query = 'SELECT * FROM authlevelstatus';
    if (module) {
      query += ' WHERE module = @module';
    }
    query += ' ORDER BY currentLevel ASC';

    const request = db.request();
    if (module) {
      request.input('module', sql.NVarChar, module);
    }
    const result = await request.query(query);

    res.json({ success: true, transitions: result.recordset });
  } catch (err) {
    console.error('Error fetching auth transitions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update estimation authorization status
app.post('/api/update-estimationcost', async (req, res) => {
  try {
    const db = await connectEstate(req.session.companyConfig);
    const { srno, action, nextLevel, nextStatus, rejectionRemarks } = req.body;

    if (!srno || !action || nextLevel === undefined || !nextStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: srno, action, nextLevel, nextStatus'
      });
    }

    // Get current user from session
    const username = req.session.user?.username;

    // Get current estimation for reference number (BEFORE updating)
    const request = db.request();
    request.input('srno', sql.Int, srno);
    let estimationResult = await request.query('SELECT * FROM estimationcost_header WHERE Srno = @srno');
    const estimation = estimationResult.recordset[0];

    if (!estimation) {
      return res.status(404).json({ success: false, error: 'Estimation not found' });
    }

    // Prepare update fields
    let updateFields = {
      AuthLevel: nextLevel,
      AuthStatus: nextStatus,
      sysdate: new Date()
    };

    if (action === 'reject' && rejectionRemarks) {
      updateFields.remarks = rejectionRemarks;
    }

    // Set appropriate user field based on action and level
    if (action === 'approve' || action === 'verify') {
      if (nextLevel === 2) {
        updateFields.VerifiedBy = username;
      } else if (nextLevel === 4) {
        updateFields.ApprovedBy = username;

        // Calculate VAT for approved estimation
        // Get all equipment items for this estimation
        const eqRequest = db.request();
        eqRequest.input('srno', sql.Int, srno);
        const eqResult = await eqRequest.query('SELECT amt FROM estimationcost_details WHERE Srno = @srno');
        const equipment = eqResult.recordset || [];

        // Calculate total amount
        const totalAmt = equipment.reduce((sum, item) => sum + (parseFloat(item.amt) || 0), 0);

        // Calculate VAT (5%)
        const vatAmount = totalAmt * 0.05;
        const grandTotal = totalAmt + vatAmount;

        updateFields.TotalAmt = totalAmt;
        updateFields.VATAmt = vatAmount;
        updateFields.GrandTotal = grandTotal;
      }
    } else if (action === 'reject') {
      if (nextLevel === 3) {
        updateFields.VerifiedBy = username;
      } else if (nextLevel === 5) {
        updateFields.ApprovedBy = username;
      }
    }

    // Build dynamic SQL for update
    let setClauses = [];
    let params = [];
    Object.entries(updateFields).forEach(([key, value], idx) => {
      setClauses.push(`${key} = @param${idx}`);
      params.push({ name: `param${idx}`, value });
    });

    const updateQuery = `
      UPDATE estimationcost_header
      SET ${setClauses.join(', ')}
      WHERE Srno = @srno
    `;

    const updateRequest = db.request();
    params.forEach(p => {
      let type;
      if (p.value instanceof Date) {
        type = sql.DateTime;
      } else if (typeof p.value === 'number') {
        type = Number.isInteger(p.value) ? sql.Int : sql.Float;
      } else {
        type = sql.NVarChar;
      }
      updateRequest.input(p.name, type, p.value);
    });
    updateRequest.input('srno', sql.Int, srno);
    const result = await updateRequest.query(updateQuery);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, error: 'Estimation not found' });
    }

    res.json({ success: true, message: 'Authorization updated successfully' });
  } catch (err) {
    console.error('Error updating estimation authorization:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add endpoint to view audit logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    const db = await connect();
    const { 
      module, 
      action, 
      username, 
      startDate, 
      endDate,
      referenceId,
      page = 1, 
      limit = 50 
    } = req.query;
    
    const filter = {};
    
    if (module) filter.module = module;
    if (action) filter.action = action;
    if (username) filter.username = { $regex: username, $options: 'i' };
    if (referenceId) filter.referenceId = { $regex: referenceId, $options: 'i' };
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await db.collection('dbo.audit_logs')
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    const total = await db.collection('dbo.audit_logs').countDocuments(filter);
    
    res.json({ 
      success: true, 
      logs, 
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  try {
    await connectMaster();
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
  
  const PORT = process.env.PORT;
  console.log(`Starting server on port ${PORT}...`);
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer();

