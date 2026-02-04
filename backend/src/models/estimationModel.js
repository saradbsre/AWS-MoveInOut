const { connectMaster, connectFinance, connectEstate } = require('../config/db');

class EstimationModel {

    static async GetChecklistEstimation() {
        const db = await connectEstate(req.session.companyConfig);
        
    }

    static async FetchItemPrices(itemno, companyConfig) {
        try{
        const db = await connectFinance(companyConfig);
        const result = await db.request()
            .input('itemno', itemno)
            .query('SELECT TOP 1 retprice FROM citem WHERE itemno = @itemno');
        return result.recordset[0].retprice;
    }catch(err){
        console.error("Error fetching item prices:", err);
        throw err;
    }
    }

    static async DeleteAllEquipment(srno, companyConfig) {
        try{
        const db = await connectEstate(companyConfig);
        await db.request()
            .input('srno', srno)
            .query('DELETE FROM estimationcost_details WHERE srno = @srno');
        return true;
        }catch(err){
            console.error("Error deleting equipment items:", err);
            throw err;
        }
    }

    static async InsertEquipmentItem(srno, item, companyConfig) {
    const db = await connectEstate(companyConfig); // or connectEstate() if that's your DB
    await db.request()
        .input('srno', srno)
        .input('counter', item.counter)
        .input('itemno', item.itemno)
        .input('itemname', item.itemname)
        .input('unit', item.unit)
        .input('qty', item.qty)
        .input('retprice', item.retprice)
        .input('amt', item.amt)
        .input('taxValue', item.taxValue)
        .input('amtTotalWithTax', item.amtTotalWithTax)
        .input('status', item.status)
        .input('remarks', item.remarks)
        .query(`
        INSERT INTO estimationcost_details
            (srno, counter, itemno, itemname, unit, qty, retprice, amt, taxValue, amtTotalWithTax, status, remarks)
        VALUES
            (@srno, @counter, @itemno, @itemname, @unit, @qty, @retprice, @amt, @taxValue, @amtTotalWithTax, @status, @remarks)
        `);
        return true;
    }
}
module.exports = EstimationModel;