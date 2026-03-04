const { connectMaster, connectFinance, connectEstate } = require('../config/db');

class ContractModel {
    static async GetContracts(companyConfig) {
        const db = await connectEstate(companyConfig);
        const result = await db.request()
            .query(`SELECT distinct contract_id,build_id,build_desc FROM dbo.contract WHERE contract_cflag = 'N'`);
        return result.recordset;
    }

    static async GetAllBuildings(companyConfig) {
        const db = await connectEstate(companyConfig);
        const result = await db.request()
            .query(`SELECT b.build_id, b.build_desc, a.area_desc, a.area_id, p.place_desc, p.place_id
                    FROM dbo.building b
                    INNER JOIN dbo.area a ON b.area_id = a.area_id
                    INNER JOIN dbo.place p ON a.place_id = p.place_id
                    ORDER BY build_desc ASC 
                    `);
        return result.recordset;
    }

    static async GetUnitsByBuilding(buildingId, companyConfig) {
        const db = await connectEstate(companyConfig);
        const result = await db.request()
            .input('buildingId', buildingId)
            .query('SELECT build_id, unit_desc FROM dbo.unit WHERE build_id = @buildingId ORDER BY unit_desc ASC');
        return result.recordset;
    }

    static async GetUnitsByContract(buildingId, contractId, companyConfig) {
    const db = await connectEstate(companyConfig);
    const result = await db.request()
        .input('buildingId', buildingId)
        .input('contractId', contractId)
        .query(`
            SELECT contract_id, build_id, unit_desc
            FROM dbo.contract
            WHERE build_id = @buildingId AND contract_id = @contractId
        `);
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
                c.contract_edate AS endDate,
                u.unit_master_desc AS unitType,
                u.unitNature AS unitNature,
                p.place_desc AS placeDesc
            FROM dbo.unit u
            INNER JOIN dbo.contract c
                ON u.build_id = c.build_id AND u.unit_desc = c.unit_desc
            INNER JOIN dbo.building b
			    ON u.build_id = b.build_id
            INNER JOIN dbo.tenant t
                ON c.tena_id = t.both
            INNER JOIN dbo.place p
                ON b.place_id = p.place_id 
            WHERE u.build_id = @buildingId AND u.unit_desc = @unitId
            ORDER BY c.contract_sdate DESC
        `);
    return result.recordset[0];
    }


    static async GetTenantContractDetailsByContractId(contractId, companyConfig) {
    const db = await connectEstate(companyConfig);
    const result = await db.request()
        .input('contractId', contractId)
        .query(`
            SELECT TOP 1
                t.both AS tenantCode,
                t.CTenantName AS tenantName,
                c.contract_id AS contractNo,
                c.contract_sdate AS startDate,
                c.contract_edate AS endDate,
                u.unit_master_desc AS unitType,
                u.unitNature AS unitNature,
                p.place_desc AS placeDesc
            FROM dbo.unit u
            INNER JOIN dbo.contract c
                ON u.build_id = c.build_id AND u.unit_desc = c.unit_desc
             INNER JOIN dbo.building b
			    ON u.build_id = b.build_id
            INNER JOIN dbo.tenant t
                ON c.tena_id = t.both
            INNER JOIN dbo.place p
                ON b.place_id = p.place_id 
            WHERE c.contract_id = @contractId
            ORDER BY c.contract_sdate DESC
        `);
    return result.recordset;
    }

    static async GetTechnicians(companyConfig, build_id, area_id) {
        let areaIds = [];

        // If area_id is provided, use it directly
        if (area_id) {
            areaIds = [area_id];
        } else if (build_id) {
            // Otherwise, get area_ids for the given build_id
            const dbEstate = await connectEstate(companyConfig);
            const areaResult = await dbEstate.request()
                .input('build_id', build_id)
                .query('SELECT area_id FROM dbo.building WHERE build_id = @build_id');
            areaIds = areaResult.recordset.map(row => row.area_id);
        }

        if (areaIds.length === 0) return [];

        const dbFinance = await connectFinance(companyConfig);
        const request = dbFinance.request();
        areaIds.forEach((id, idx) => request.input(`area_id${idx}`, id));
        const areaIdParams = areaIds.map((_, idx) => `@area_id${idx}`).join(',');

        const result = await request.query(`
            SELECT DISTINCT uname 
            FROM CatTech 
            WHERE area_id IN (${areaIdParams})
        `);

        return result.recordset;
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
    try {
        const db = await connectEstate(companyConfig);
        await db.request()
            .input('contract_id', checklistDoc.contract_id)
            .input('build_id', checklistDoc.build_id)
            .input('unit_desc', checklistDoc.unit_desc)
            .input('contract_sdate', checklistDoc.startDate && checklistDoc.startDate !== '' ? checklistDoc.startDate : null)
            .input('contract_edate', checklistDoc.endDate && checklistDoc.endDate !== '' ? checklistDoc.endDate : null)
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
            .input('subComp_id', checklistDoc.subComp_id)
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

        // Only update complaint and complaintsDetail if visitType is 'Complaint'
        if (
            checklistDoc.visitType &&
            checklistDoc.visitType.toLowerCase() === 'complaint'
        ) {
            // Update complaint table
            await db.request()
                .input('refNum', checklistDoc.refNum)
                .query(`
                    UPDATE complaint
                    SET status = 'VISITED',
                    auditrev = ISNULL(auditrev,0) + 1
                    WHERE complaintNum = @refNum
                `);

            // Update complaintsDetail table
            await db.request()
                .input('refNum', checklistDoc.refNum)
                .input('subComp_id', checklistDoc.subComp_id)
                .query(`
                    UPDATE complaintsDetail
                    SET status = 'VISITED',
                    auditrev = ISNULL(auditrev,0) + 1
                    WHERE complaintNum = @refNum AND subComp_id = @subComp_id
                `);
        }

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

   static async InsertComplaint(complaint, companyConfig) {
    const db = await connectEstate(companyConfig);
    await db.request()
      .input('complaintNum', complaint.complaintNum)
      .input('complaintType', complaint.complaintType)
      .input('build_id', complaint.build_id)
      .input('build_desc', complaint.build_desc)
      .input('unit_desc', complaint.unit_desc)
      .input('block', complaint.block)
      .input('floor', complaint.floor)
      .input('accessArea', complaint.accessArea)
      .input('both', complaint.both)
      .input('CTenantName', complaint.CTenantName)
      .input('contract_id', complaint.contract_id)
  .input('contract_sdate', complaint.contract_sdate && complaint.contract_sdate !== '' ? complaint.contract_sdate : null)
  .input('contract_edate', complaint.contract_edate && complaint.contract_edate !== '' ? complaint.contract_edate : null)
      .input('type', complaint.type)
      .input('description', complaint.description)
      .input('status', complaint.status)
      .input('auditrev', complaint.auditrev ?? 1)
      .input('userid', complaint.userid)
      .input('Date', complaint.Date)
      .input('assigned', complaint.assigned ?? 0)
      .input('preparedBy', complaint.preparedBy ?? '')
      .input('authLevel', complaint.authLevel ?? 1)
      .input('authStatus', complaint.authStatus ?? 'AWAITING FOR APPROVAL')
      // sysdate is defaulted in table, no need to insert
      .query(`
        INSERT INTO dbo.complaint (
          complaintNum, complaintType, build_id, build_desc, unit_desc, block, accessArea, both, CTenantName,
          contract_id, contract_sdate, contract_edate, type, description, status, auditrev, userid, Date, assigned,floor_no, preparedBy, authLevel, authStatus
        ) VALUES (
           @complaintNum, @complaintType, @build_id, @build_desc, @unit_desc, @block, @accessArea, @both, @CTenantName,
          @contract_id, @contract_sdate, @contract_edate, @type, @description, @status, @auditrev, @userid, @Date, @assigned, @floor, @preparedBy, @authLevel, @authStatus
        )
      `);

      //console.log("complaint details:", complaint);
    return true;
    }

    static async InsertComplaintDetails(complaint, companyConfig) {
  const db = await connectEstate(companyConfig);

  // 🔹 INSERT into complaintsDetail
  await db.request()
    .input('complaint_id', complaint.complaint_id) // This should be the ID from the complaint table
    .input('complaintNum', complaint.complaintNum)
    .input('build_id', complaint.build_id)
    .input('build_desc', complaint.build_desc)
    .input('unit_desc', complaint.unit_desc)
    .input('both', complaint.both)
    .input('CTenantName', complaint.CTenantname)
    .input('contract_id', complaint.contract_id)
    .input('status', complaint.status)
    .input('assigned_to', complaint.assigned_to)
    .input('assigned_by', complaint.assigned_by)
    .input('assigned_date', complaint.assigned_date || null)
    .input('category', complaint.category)
    .input('remarks', complaint.remarks)
    .input('auditrev', complaint.auditrev ?? 1)
    .input('userid', complaint.userid)
    .input('Date', complaint.Date)
    .input('Aupdate', 1)
    .input('itemname', complaint.itemname)
    .input('itemno', complaint.itemno)
    .input('qty', complaint.qty)
    .input('barcode', complaint.barcode)
    .input('counter', complaint.counter)
    .input('tenantsignature', complaint.tenantsignature)
    .input('techniciansignature', complaint.techniciansignature)
    .input('brdcode', complaint.brdcode)
    .input('subcode', complaint.subcode)
    .input('unit', complaint.unit)
  .input('contract_sdate', complaint.contract_sdate && complaint.contract_sdate !== '' ? complaint.contract_sdate : null)
  .input('contract_edate', complaint.contract_edate && complaint.contract_edate !== '' ? complaint.contract_edate : null)
    .query(`
      INSERT INTO dbo.complaintsDetail (
        complaint_id, complaintNum, build_id, build_desc, unit_desc, both, CTenantName,
        contract_id, status, assigned_to, assigned_by, assigned_date,
        category, remarks, auditrev, userid, Date, Aupdate,
        itemname, itemno, qty, barcode, counter,
        tenantsignature, techniciansignature, brdcode, subcode, unit,
        contract_sdate, contract_edate
      )
      VALUES (
        @complaint_id, @complaintNum, @build_id, @build_desc, @unit_desc, @both, @CTenantName,
        @contract_id, @status, @assigned_to, @assigned_by, @assigned_date,
        @category, @remarks, @auditrev, @userid, @Date, @Aupdate,
        @itemname, @itemno, @qty, @barcode, @counter,
        @tenantsignature, @techniciansignature, @brdcode, @subcode, @unit,
        @contract_sdate, @contract_edate
      )
    `);

  // 🔹 AFTER INSERT → Update complaint table
  await db.request()
    .input('complaint_id', complaint.complaint_id)
    .query(`
      UPDATE dbo.complaint
      SET status = 'VISITED',
      auditrev = ISNULL(auditrev,0) + 1
      WHERE complaint_id = @complaint_id
    `);

  return true;
}



     static async InsertComplaintImages(build_id, complaintNum, imageBuffer, mimetype, companyConfig) {
    try{
      const db = await connectEstate(companyConfig);
      await db.request()
      .input('build_id', build_id)
      .input('complaintNum', complaintNum)
      .input('image', imageBuffer)
      .input('mimetype', mimetype)
      .query('INSERT INTO complaint_images (build_id, complaintNum, image, mimetype) VALUES (@build_id, @complaintNum, @image, @mimetype)');
    return true;
    } catch (error) {
      throw new Error(`Error inserting complaint images: ${error.message}`);
    }
    }

   static async GetComplaints(companyConfig) {
    const db = await connectEstate(companyConfig);

    // 1️⃣ Get complaints
    const complaintsResult = await db.request()
        .query(`
            SELECT 
                c.*,
                u.unit_master_desc,
                u.unitNature,
                p.place_desc
            FROM dbo.complaint c
            LEFT JOIN dbo.building b ON c.build_id = b.build_id
            LEFT JOIN dbo.unit u 
                ON c.unit_desc = u.unit_desc 
                AND c.build_id = u.build_id
            LEFT JOIN dbo.place p ON b.place_id = p.place_id
            WHERE c.status IN ('PENDING','APPROVED')
            ORDER BY c.Date DESC
        `);

    // 2️⃣ Get complaint details
    const detailsResult = await db.request()
        .query(`
            SELECT complaint_id, category, remarks, counter
            FROM dbo.complaintsDetail
            ORDER BY complaint_id, counter
        `);

    // 3️⃣ Get complaint images (using complaintNum)
    const imagesResult = await db.request()
        .query(`
            SELECT complaintNum, image, mimetype
            FROM dbo.complaint_images
            WHERE image IS NOT NULL
        `);

    // 🔹 Group details by complaint_id
    const detailsByComplaint = {};
    for (const detail of detailsResult.recordset) {
        if (!detailsByComplaint[detail.complaint_id]) {
            detailsByComplaint[detail.complaint_id] = [];
        }
        detailsByComplaint[detail.complaint_id].push(detail);
    }

    // 🔹 Group images by complaintNum
    const imagesByComplaint = {};
    for (const img of imagesResult.recordset) {

        if (!imagesByComplaint[img.complaintNum]) {
            imagesByComplaint[img.complaintNum] = [];
        }

        // Convert VARBINARY to Base64
        const base64Image = img.image
            ? `data:${img.mimetype};base64,${img.image.toString('base64')}`
            : null;

        imagesByComplaint[img.complaintNum].push({
            image: base64Image,
            mimetype: img.mimetype
        });
    }

    // 🔹 Attach everything
    const complaintsWithDetails = complaintsResult.recordset.map(complaint => ({
        ...complaint,
        complaintDetails: detailsByComplaint[complaint.complaint_id] || [],
        complaintImages: imagesByComplaint[complaint.complaintNum] || []
    }));

    return complaintsWithDetails;
}

    
    static async GetComplaintDetailsByCategory(companyConfig, area_id, build_id) {
        const db = await connectEstate(companyConfig);

        let query, request;

        // If build_id is provided but not area_id, get area_id for the build_id
        if (!area_id && build_id) {
            const areaResult = await db.request()
                .input('build_id', build_id)
                .query('SELECT area_id FROM dbo.building WHERE build_id = @build_id');
            if (areaResult.recordset.length > 0) {
                area_id = areaResult.recordset[0].area_id;
            }
        }
        //console.log('GetComplaintDetails called with area_id:', area_id, 'build_id:', build_id);
        if (area_id) {
            // Get build_ids for the area_id
            const buildResult = await db.request()
                .input('area_id', area_id)
                .query('SELECT build_id FROM dbo.building WHERE area_id = @area_id');
            const buildIds = buildResult.recordset.map(row => row.build_id);

            if (buildIds.length === 0) return [];

            // Prepare parameterized query for build_ids
            request = db.request();
            buildIds.forEach((id, idx) => request.input(`build_id${idx}`, id));
            const buildIdParams = buildIds.map((_, idx) => `@build_id${idx}`).join(',');

            query = `
                 SELECT 
                c.*,
                b.build_desc,
                u.unit_master_desc,
                u.unitNature,
                p.place_desc
            FROM dbo.complaintsDetail c
            LEFT JOIN dbo.building b ON c.build_id = b.build_id
            LEFT JOIN dbo.unit u ON c.unit_desc = u.unit_desc AND c.build_id = u.build_id
            LEFT JOIN dbo.place p ON b.place_id = p.place_id
                WHERE c.build_id IN (${buildIdParams}) and c.status in ('PENDING','ASSIGNED')
                ORDER BY c.Date DESC
            `;
        } else {
            // No area_id and no build_id: get all complaint details
            request = db.request();
            query = `
                         SELECT 
                c.*,
                b.build_desc,
                u.unit_master_desc,
                u.unitNature,
                p.place_desc
            FROM dbo.complaintsDetail c
            LEFT JOIN dbo.building b ON c.build_id = b.build_id
            LEFT JOIN dbo.unit u ON c.unit_desc = u.unit_desc AND c.build_id = u.build_id
            LEFT JOIN dbo.place p ON b.place_id = p.place_id
                ORDER BY Date DESC
            `;
        }

        const result = await request.query(query);
        return result.recordset;
    }

   static async GetComplaintDetails(companyConfig) {
    const db = await connectEstate(companyConfig);

    // Fetch all complaint details with joins for extra info
    const result = await db.request()
        .query(`
            SELECT 
                c.*,
                b.build_desc,
                u.unit_master_desc,
                u.unitNature,
                p.place_desc
            FROM dbo.complaintsDetail c
            LEFT JOIN dbo.building b ON c.build_id = b.build_id
            LEFT JOIN dbo.unit u ON c.unit_desc = u.unit_desc AND c.build_id = u.build_id
            LEFT JOIN dbo.place p ON b.place_id = p.place_id
            ORDER BY c.complaintNum, c.category
        `);

    // Group by complaintNum, but keep all complaint fields (from the first row for each complaintNum)
    const grouped = {};
    for (const row of result.recordset) {
        if (!grouped[row.complaintNum]) {
            // Copy all fields except the grouped items array
            grouped[row.complaintNum] = {
                ...row,
                items: []
            };
        }
        grouped[row.complaintNum].items.push({
            category: row.category,
            remarks: row.remarks,
            itemname: row.itemname,
            itemno: row.itemno,
            brdcode: row.brdcode,
            subcode: row.subcode,
            qty: row.qty,
            unit: row.unit
        });
    }

    // Return as array
    return Object.values(grouped);
}

    static async UpdateComplaintDetails({
        complaint_id,
        subComp_id,
        status,
        assigned_to,
        assigned_by,
        assigned_date,
        auditrev
        }, companyConfig) {
        const db = await connectEstate(companyConfig);

        // Update complaintsDetail table
        await db.request()
            .input('complaint_id', complaint_id)
            .input('subComp_id', subComp_id)
            .input('status', status)
            .input('assigned_to', assigned_to)
            .input('assigned_by', assigned_by)
            .input('assigned_date', assigned_date && assigned_date !== '' ? assigned_date : null)
            .input('auditrev', auditrev)
            .query(`
                UPDATE dbo.complaintsDetail
                SET status = @status,
                    assigned_to = @assigned_to,
                    assigned_by = @assigned_by,
                    assigned_date = @assigned_date,
                    auditrev = @auditrev
                WHERE complaint_id = @complaint_id AND subComp_id = @subComp_id
            `);

        // Update complaint table
        await db.request()
            .input('complaint_id', complaint_id)
            .input('status', status)
            .input('auditrev', auditrev)
            .input('assigned', status === 'ASSIGNED' ? 1 : 0)
            .query(`
                UPDATE dbo.complaint
                SET status = @status,
                    auditrev = @auditrev,
                    assigned = @assigned
                WHERE complaint_id = @complaint_id
            `);

        return true;
    }

    static async EditComplaint(complaint_id, description, block, floor, place, build_desc, unit_desc, status, approvedBy, authLevel, authStatus, companyConfig) {
        const db = await connectEstate(companyConfig);
        await db.request()
            .input('complaint_id', complaint_id)
            .input('description', description)
            .input('block', block)
            .input('floor', floor)
            .input('place', place)
            .input('build_desc', build_desc)
            .input('unit_desc', unit_desc)
            .input('status', status)
            .input('approvedBy', approvedBy)
            .input('authLevel', authLevel)
            .input('authStatus', authStatus)
            .query(`
                UPDATE dbo.complaint
                SET description = @description,
                    block = @block,
                    floor_no = @floor,
                    accessArea = @place,
                    build_desc = @build_desc,
                    unit_desc = @unit_desc,
                    status = @status,
                    approvedBy = @approvedBy,
                    authLevel = @authLevel,
                    authStatus = @authStatus,
                    auditrev = ISNULL(auditrev,0) + 1
                WHERE complaint_id = @complaint_id
            `);
        return true;
    }

    static async DeleteComplaint(complaint_id, companyConfig) {
        const db = await connectEstate(companyConfig);
        await db.request()
            .input('complaint_id', complaint_id)
            .query(`
                DELETE FROM dbo.complaintsDetail WHERE complaint_id = @complaint_id;
                DELETE FROM dbo.complaint WHERE complaint_id = @complaint_id;
            `);
        return true;
    }

    static async DeleteComplaintDetails(complaint_id, subComp_id, companyConfig) {
        const db = await connectEstate(companyConfig);
        await db.request()
            .input('complaint_id', complaint_id)
            .input('subComp_id', subComp_id)
            .query(`
                DELETE FROM dbo.complaintsDetail 
                WHERE complaint_id = @complaint_id AND subComp_id = @subComp_id;
            `);
        return true;
    }

   static async GetComplaintCategories(companyConfig) {
    const db = await connectFinance(companyConfig);
    const result = await db.request()
        .query(`
           select * from season
        `);
     return result.recordset;
    }

    static async GetCategoryItems(companyConfig, sscode){
        const db = await connectFinance(companyConfig);
        const result = await db.request()
            .input('sscode', sscode)
            .query(`
                SELECT * FROM dbo.citem WHERE sscode = @sscode
            `);
        return result.recordset;
    }

    static async GetUserLists(companyConfig, technician) {
        const db = await connectFinance(companyConfig);
        let query = `SELECT Uname FROM dbo.tbluser WHERE disabled = '0' AND technician = @technician ORDER BY Uname ASC`;
        const result = await db.request()
            .input('technician', technician)
            .query(query);
        return result.recordset;
    }

    static async AddTechnicians(companyConfig, usernames) {
        const db = await connectFinance(companyConfig);
        if (!Array.isArray(usernames) || usernames.length === 0) return false;
        // Extract Uname if array contains objects
        const unameList = usernames.map(u => typeof u === 'string' ? u : u.Uname);
        const params = unameList.map((_, i) => `@username${i}`).join(", ");
        const request = db.request();
        unameList.forEach((uname, i) => request.input(`username${i}`, uname));
        await request.query(
            `UPDATE dbo.tbluser SET technician = 1 WHERE Uname IN (${params})`
        );
        console.log('query', `UPDATE dbo.tbluser SET technician = 1 WHERE Uname IN (${params})`, 'with params', unameList);
        return true;
    }

    static async AddCatTech(companyConfig, area_ids, userid, technicians, cat_id) {
    const db = await connectFinance(companyConfig);
    for (const area_id of area_ids) {
        for (const tech of technicians) {
        const uname = typeof tech === "string" ? tech : tech.Uname;
        await db.request()
            .input("cat_id", cat_id) // use the provided cat_id
            .input("area_id", area_id)
            .input("uname", uname)
            .input("userid", userid)
            .query(`
            INSERT INTO CatTech (cat_id, area_id, uname, userid, sysdate, auditrev)
            VALUES (@cat_id, @area_id, @uname, @userid, GETDATE(), 0)
            `);
        }
    }
    return true;
    }

    static async GetCatTechnicians(companyConfig, cat_id) {
        // Step 1: Get CatTech rows from finance DB
        const dbFinance = await connectFinance(companyConfig);
        const catTechResult = await dbFinance.request()
            .input('cat_id', cat_id)
            .query('SELECT uname, area_id FROM CatTech WHERE cat_id = @cat_id');

        // Step 2: Get all areas from estate DB
        const dbEstate = await connectEstate(companyConfig);
        const areaResult = await dbEstate.request()
            .query('SELECT area_id, area_desc FROM dbo.area');

        // Build a map of area_id -> area_desc
        const areaMap = {};
        for (const area of areaResult.recordset) {
            areaMap[area.area_id] = area.area_desc;
        }

        // Step 3: Group by uname and attach area_desc
        const techMap = {};
        for (const row of catTechResult.recordset) {
            if (!techMap[row.uname]) techMap[row.uname] = [];
            techMap[row.uname].push({
                area_id: row.area_id,
                area_desc: areaMap[row.area_id] || null
            });
        }

        // Convert to array
        return Object.entries(techMap).map(([uname, areas]) => ({ uname, areas }));
    }

    static async DeleteTechnicianFromUser(companyConfig, uname) {
        const db = await connectFinance(companyConfig);
        await db.request()
            .input('uname', uname)
            .query('UPDATE dbo.tbluser SET technician = 0 WHERE Uname = @uname');
        await db.request()
            .input('uname', uname)
            .query('DELETE FROM CatTech WHERE uname = @uname');
        return true;
    }

    static async DeleteCatTech(companyConfig, cat_id, uname) {
        const db = await connectFinance(companyConfig);
        await db.request()
            .input('cat_id', cat_id)
            .input('uname', uname)
            .query('DELETE FROM CatTech WHERE cat_id = @cat_id AND uname = @uname');
        return true;
    }

    static async AddComplaintCategory(companyConfig, code, description) {
    const db = await connectEstate(companyConfig);
    await db.request()
        .input("code", code)
        .input("description", description)
        .query("INSERT INTO compcategory (comp_cat_code, comp_cat_desc) VALUES (@code, @description)");
    return true;
    }

    static async DeleteComplaintCategory(companyConfig, code) {
    const db = await connectEstate(companyConfig);
    await db.request()
        .input("code", code)
        .query("DELETE FROM compcategory WHERE comp_cat_code = @code");
    return true;
    }

    static async GetArea (companyConfig) {
        const db = await connectEstate(companyConfig);
        const result = await db.request()
            .query(`SELECT area_id, area_desc FROM dbo.area ORDER BY area_desc ASC`);
        return result.recordset;
     }

     static async GetMappedTechs(companyConfig, cat_id, area_id) {
        const db = await connectFinance(companyConfig);
        
        const result = await db.request()
            .input('cat_id', cat_id ? cat_id : null)
            .input('area_id', area_id ? area_id : null)
            .query(`
                SELECT DISTINCT uname
                FROM CatTech
                WHERE (@cat_id IS NULL OR cat_id = @cat_id)
                AND (@area_id IS NULL OR area_id = @area_id)
            `);
            
        return result.recordset.map(row => row.uname);
     }

     static async GetComplaintTypes(companyConfig,complaintNum) {
        const db = await connectEstate(companyConfig);
        const result = await db.request()
            .input('complaintNum', complaintNum)
            .query(`
                SELECT DISTINCT complaintType
                FROM dbo.complaint
                WHERE complaintNum = @complaintNum
            `);
        return result.recordset.map(row => row.complaintType);
     }

     static async GetChecklist(companyConfig) {
    const db = await connectEstate(companyConfig);
    const result = await db.request()
        .query(`
            SELECT 
                c.*,
                b.build_desc,
                u.unit_master_desc,
                u.unitNature,
                p.place_desc
            FROM dbo.checklist c
            LEFT JOIN dbo.building b ON c.build_id = b.build_id
            LEFT JOIN dbo.unit u ON c.unit_desc = u.unit_desc AND c.build_id = u.build_id
            LEFT JOIN dbo.place p ON b.place_id = p.place_id
        `);
    return result.recordset;
}

static async InsertAssignedComplaint(data, companyConfig) {
    console.log("Inserting assigned complaint with data:", data);
    const db = await connectEstate(companyConfig);

    // Check if complaint_id + category already exists
    const checkResult = await db.request()
      .input('complaint_id', data.complaint_id)
      .input('category', data.category)
      .query(`SELECT auditrev FROM ComplaintAssigned WHERE complaint_id = @complaint_id AND category = @category`);

    if (checkResult.recordset.length > 0) {
      // Exists: update and increment auditrev
      const currentAuditRev = checkResult.recordset[0].auditrev || 1;
      await db.request()
        .input('complaint_id', data.complaint_id)
        .input('complaintNum', data.complaintNum)
        .input('Date', data.Date)
        .input('build_id', data.build_id)
        .input('build_desc', data.build_desc)
        .input('unit_desc', data.unit_desc)
        .input('status', data.status)
        .input('assigned_to', data.assigned_to)
        .input('assigned_by', data.assigned_by)
        .input('assigned_date', data.assigned_date)
        .input('category', data.category)
        .input('auditrev', currentAuditRev + 1)
        .input('userid', data.userid)
        .input('sysdate', new Date())
        .query(`
          UPDATE ComplaintAssigned SET
            complaintNum = @complaintNum,
            Date = @Date,
            build_id = @build_id,
            build_desc = @build_desc,
            unit_desc = @unit_desc,
            status = @status,
            assigned_to = @assigned_to,
            assigned_by = @assigned_by,
            assigned_date = @assigned_date,
            auditrev = @auditrev,
            userid = @userid,
            sysdate = @sysdate
          WHERE complaint_id = @complaint_id AND category = @category
        `);
    } else {
      // Not exists: insert
      await db.request()
        .input('complaint_id', data.complaint_id)
        .input('complaintNum', data.complaintNum)
        .input('Date', data.Date)
        .input('build_id', data.build_id)
        .input('build_desc', data.build_desc)
        .input('unit_desc', data.unit_desc)
        .input('status', data.status)
        .input('assigned_to', data.assigned_to)
        .input('assigned_by', data.assigned_by)
        .input('assigned_date', data.assigned_date)
        .input('category', data.category)
        .input('auditrev', data.auditrev ?? 1)
        .input('userid', data.userid)
        .input('sysdate', new Date())
        .query(`
          INSERT INTO ComplaintAssigned (
            complaint_id, complaintNum, Date, build_id, build_desc, unit_desc,
            status, assigned_to, assigned_by, assigned_date, category, auditrev, userid, sysdate
          ) VALUES (
            @complaint_id, @complaintNum, @Date, @build_id, @build_desc, @unit_desc,
            @status, @assigned_to, @assigned_by, @assigned_date, @category, @auditrev, @userid, @sysdate
          )
        `);
    }

    // Update complaint and complaintsDetail status for this complaint_id
    await db.request()
      .input('complaint_id', data.complaint_id)
      .input('status', 'ASSIGNED')
      .query(`
        UPDATE complaint
        SET status = @status
        WHERE complaint_id = @complaint_id
      `);

    await db.request()
      .input('complaint_id', data.complaint_id)
      .input('status', 'ASSIGNED')
      .query(`
        UPDATE complaintsDetail
        SET status = @status
        WHERE complaint_id = @complaint_id
      `);

    return true;
}

  static async GetAssignedComplaints(userid,companyConfig) {
    const db = await connectEstate(companyConfig);
    const result = await db.request()
        .input('userid', userid)
        .query(`
            SELECT *
            FROM ComplaintAssigned
            WHERE assigned_to = @userid
            ORDER BY Date DESC
        `);
    return result.recordset;
}
  static async CloseComplaint(complaint_id, companyConfig) {
    const db = await connectEstate(companyConfig);
    await db.request()
      .input('complaint_id', complaint_id)
      .input('status', 'CLOSED')
      .query(`
        UPDATE complaint
        SET status = @status
        WHERE complaint_id = @complaint_id
      `);
    await db.request()
      .input('complaint_id', complaint_id)
      .input('status', 'CLOSED')
      .query(`
        UPDATE complaintsDetail
        SET status = @status
        WHERE complaint_id = @complaint_id
      `);
    await db.request()
      .input('complaint_id', complaint_id)
      .input('status', 'CLOSED')
        .query(`
            UPDATE ComplaintAssigned
            SET status = @status
            WHERE complaint_id = @complaint_id
        `);
    return true;
        }

}
module.exports = ContractModel;