require('dotenv').config();
const sql = require('mssql');

// ----------------------
// Master DB (Centralized) Pool - single shared
// ----------------------
const masterConfig = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE, // CENTRALIZEDDB
  options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true },
  pool: { max: 50, min: 5, idleTimeoutMillis: 60000, acquireTimeoutMillis: 30000 }
};

let masterPool = null;

async function connectMaster() {
  if (masterPool && masterPool.connected) return masterPool;

  masterPool = await sql.connect(masterConfig);
  masterPool.on('error', err => {
    console.error('❌ CENTRALIZEDDB pool error:', err);
    masterPool = null;
  });

  return masterPool;
}

// ----------------------
// Multi-User DB Pools (Finance/Estate)
// ----------------------
const userPools = new Map(); // key: server|database|user

function parseConnectionString(connString) {
  const parts = {};
  connString.split(';').forEach(part => {
    const [key, value] = part.split('=').map(s => s.trim());
    if (key && value) {
      parts[key.toLowerCase().replace(/\s+/g, '')] = value;
    }
  });

  return {
    server: parts['datasource'] || parts['server'],
    database: parts['initialcatalog'] || parts['database'],
    user: parts['uid'] || parts['user'],
    password: parts['pwd'] || parts['password']
  };
}

async function connectUser(connString) {
  const conn = parseConnectionString(connString);
  const key = `${conn.server}|${conn.database}|${conn.user}`;

  if (userPools.has(key)) {
    const existingPool = userPools.get(key);
    if (existingPool.connected) return existingPool;
    // Remove stale pool
    userPools.delete(key);
  }

  const poolConfig = {
    user: conn.user,
    password: conn.password,
    server: conn.server,
    database: conn.database,
    options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true },
    pool: { max: 20, min: 2, idleTimeoutMillis: 60000 }
  };

  const pool = await new sql.ConnectionPool(poolConfig).connect();
  
  // Remove pool on error to allow automatic reconnect next time
  pool.on('error', err => {
    console.error(`User pool error (${key}):`, err.message);
    userPools.delete(key);
  });

  userPools.set(key, pool);
  return pool;
}

// Convenience functions
async function connectFinance(companyConfig) {
  if (!companyConfig?.VEconnstring) throw new Error('Missing VE connection string');
  return connectUser(companyConfig.VEconnstring);
}

async function connectEstate(companyConfig) {
  if (!companyConfig?.ESTconnstring) throw new Error('Missing EST connection string');
  return connectUser(companyConfig.ESTconnstring);
}

// ----------------------
// Example: Get company config
// ----------------------
async function getCompanyConfigByDomain(domain) {
  const pool = await connectMaster();
  const result = await pool.request()
    .input('domain', sql.NVarChar, domain)
    .query(`
      SELECT TOP 1
        id, companyName, Cocode, CompanyDb, VEconnstring, ESTconnstring, DBServer, domainLink3
      FROM dbo.IntegratedCompany
      WHERE domainLink3 = @domain
      ORDER BY Cocode DESC
    `);

  if (!result.recordset.length) throw new Error(`Company not found for domain: ${domain}`);
  return result.recordset[0];
}

// ----------------------
// Health check (optional)
// ----------------------
function getConnectionStatus() {
  return {
    centralized: masterPool?.connected || false,
    users: Array.from(userPools.entries()).map(([k, p]) => ({ key: k, connected: p.connected }))
  };
}

// ----------------------
// Graceful shutdown (optional)
// ----------------------
async function closeAllPools() {
  if (masterPool) await masterPool.close();
  for (const [key, pool] of userPools) {
    if (pool.connected) await pool.close();
  }
  userPools.clear();
}

module.exports = {
  connectMaster,
  connectFinance,
  connectEstate,
  getCompanyConfigByDomain,
  getConnectionStatus,
  closeAllPools,
  sql
};
