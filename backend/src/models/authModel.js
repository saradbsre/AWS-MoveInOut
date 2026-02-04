const { connectMaster, connectFinance, connectEstate } = require('../config/db');
const sql = require('mssql');

class AuthModel {

    static async testConnection() {
        const db = await connectMaster();
        const result = await db.request()
        .query(`SELECT 1 AS Connected`);
        return result.recordset[0];
    }
    
    static async decryptPassword(username){
        const db = await connectFinance(req.session.companyConfig);
        const result = await db.request()
        .input('username', sql.NVarChar, username)
        .query(`SELECT
        CAST(DECRYPTBYPASSPHRASE('I CANT TELL YOU', password) AS VARCHAR(8000)) AS decryptedPassword
        FROM dbo.tbluser WHERE Uname = '${username}'`);
        console.log('Username:', username);
        console.log(result.recordset[0]);
        return result.recordset[0];
    }

    static async findActiveSession(Username, companyConfig) {
        const db = await connectFinance(companyConfig);  // Sessions are in Finance DB
        const result = await db.request()
            .input('username', sql.NVarChar, Username)
            .query(`
                SELECT TOP 1 * 
                FROM dbo.sessions 
                WHERE expires > GETDATE() 
                AND session LIKE '%"username":"' + @username + '"%'
            `);
        return result.recordset[0];
    }

    static async FindUserByUsername(Username, companyConfig) {
        const db = await connectFinance(companyConfig);  // Users are in Finance DB
        const result = await db.request()
            .input('username', sql.NVarChar, Username)
            .query(`SELECT Uname, 
                CAST(DECRYPTBYPASSPHRASE('I CANT TELL YOU', password) AS VARCHAR(8000)) AS decryptedPassword,
                roleid
                FROM dbo.tbluser WHERE Uname = @username`);
        return result.recordset[0];
    }

    static async FindTenantByUsername(Username) {
        const db = await connectEstate(req.session.companyConfig);  // Tenants are in Estate DB
        const result = await db.request()
            .input('username', sql.NVarChar, Username)
            .query(`SELECT * FROM dbo.tenant WHERE both = @username`);
        return result.recordset[0];
    }

    static async FindTenant(Username) {
        const db = await connectEstate(req.session.companyConfig);  // Contracts are in Estate DB
        const result = await db.request()
            .input('username', sql.NVarChar, Username)
            .query(`
                SELECT 
                    contract_id,
                    build_id,
                    build_desc,
                    unit_desc,
                    contract_sdate,
                    contract_edate,
                    contract_date
                FROM dbo.contract 
                WHERE tena_id = @username 
                AND contract_cflag = 'N'
            `);
        return result.recordset;  // Returns array (all contracts)
    }

    static async GetModuleAccess(roleid, companyConfig) {
        const db = await connectFinance(companyConfig);  // Modules are in Finance DB
        const result = await db.request()
            .input('roleid', sql.VarChar, roleid)
            .query(`
                SELECT 
                    r.type,
                    r.access,
                    r.[add],
                    r.[delete],
                    r.[modify],
                    r.[print],
                    m.module,
                    m.mdefault
                FROM dbo.role2 r
                LEFT JOIN dbo.module m ON r.type = m.type
                WHERE r.roleid = @roleid 
                AND r.access = 'YES'
            `);
        return result.recordset;  // Returns array
    }

}

module.exports = AuthModel;