const { connectMaster, connectFinance, connectEstate } = require('../config/db');

class ContractModel {
    static async GetAllBuildings(companyConfig) {
        const db = await connectEstate(companyConfig);
        const result = await db.request()
            .query('SELECT build_id, build_desc FROM dbo.building ORDER BY build_desc ASC');
        return result.recordset;
    }

    static async GetUnitsByBuilding(buildingId, companyConfig) {
        const db = await connectEstate(companyConfig);
        const result = await db.request()
            .input('buildingId', buildingId)
            .query('SELECT build_id, unit_desc FROM dbo.unit WHERE build_id = @buildingId ORDER BY unit_desc ASC');
        return result.recordset;
    }

    static async GetTenantContractDetails(buildingId, unitId, companyConfig) {
      const db = await connectEstate(companyConfig);
      const result = await db.request()
        .input('buildingId', buildingId)
        .input('unitId', unitId)
        .query(`
            SELECT TOP 1
                t.both AS tenantCode,
                t.CTenantName AS tenantName,
                c.contract_id AS contractNo,
                c.contract_sdate AS startDate,
                c.contract_edate AS endDate
            FROM dbo.unit u
            INNER JOIN dbo.contract c
                ON u.build_id = c.build_id AND u.unit_desc = c.unit_desc
            INNER JOIN dbo.tenant t
                ON c.tena_id = t.both
            WHERE u.build_id = @buildingId AND u.unit_desc = @unitId
            ORDER BY c.contract_sdate DESC
        `);
        return result.recordset[0]
    }

    // Get equipment master list
    static async GetEquipmentMasterList(companyConfig) {
        const db = await connectFinance(companyConfig);
        const result = await db.request()
            .query(`
                SELECT grpcode, sscode, brdcode, subcode, itemno, itemname, majunit
                FROM dbo.citem
            `);
        return result.recordset;
    }

    static async InsertChecklist(checklistDoc, companyConfig) {
    try{
    // for (const [key, value] of Object.entries(checklistDoc)) {
    //   if (typeof value === 'string') {
    //     console.log(`${key}: length=${value.length}, value=${value}`);
    //   }
    // }

    const db = await connectEstate(companyConfig);
    await db.request()
      .input('contract_id', checklistDoc.contract_id)
      .input('build_id', checklistDoc.build_id)
      .input('unit_desc', checklistDoc.unit_desc)
      .input('contract_sdate', checklistDoc.startDate)
      .input('contract_edate', checklistDoc.endDate)
      .input('barcode', checklistDoc.barcode)
      .input('counter', checklistDoc.counter)
      .input('refNum', checklistDoc.refNum)
      .input('visitType', checklistDoc.visitType)
      .input('tenantid', checklistDoc.tenantCode)
      .input('CTenantName', checklistDoc.tenantName)
      .input('tenantSignature', checklistDoc.tenantsignature)
      .input('technicianSignature', checklistDoc.techniciansignature)
      .input('itemno', checklistDoc.itemno)
      .input('itemname', checklistDoc.itemname)
      .input('brdcode', checklistDoc.brdcode)
      .input('subcode', checklistDoc.subcode)
      .input('unit', checklistDoc.unit)
      .input('qty', checklistDoc.qty)
      .input('status', checklistDoc.status)
      .input('remarks', checklistDoc.remarks)
      .input('userid', checklistDoc.userid)
      .query(`
        INSERT INTO checklist (
          contract_id, build_id, unit_desc, contract_sdate, contract_edate, counter, barcode, refNum, visitType, both, CTenantName,
          tenantSignature, technicianSignature, itemno, itemname, brdcode, subcode, unit, qty, status, remarks, userid
        ) VALUES (
          @contract_id, @build_id, @unit_desc, @contract_sdate, @contract_edate, @counter, @barcode, @refNum, 
          @visitType, @tenantid, @CTenantName,@tenantSignature, @technicianSignature, @itemno, @itemname, @brdcode, 
          @subcode, @unit, @qty, @status, @remarks, @userid
        );
        `);
      return true;
    } catch (error) {
      throw new Error(`Error inserting checklist: ${error.message}`);
    }
    }

    static async InsertChecklistImages(contract, refNum, imageBuffer, mimetype, companyConfig) {
    try{
      const db = await connectEstate(companyConfig);
      await db.request()
      .input('contract_id', contract)
      .input('refNum', refNum)
      .input('image', imageBuffer)
      .input('mimetype', mimetype)
      .query('INSERT INTO checklist_images (contract_id, refNum, image, mimetype) VALUES (@contract_id, @refNum, @image, @mimetype)');
    return true;
    } catch (error) {
      throw new Error(`Error inserting checklist: ${error.message}`);
    }
    }
}
module.exports = ContractModel;