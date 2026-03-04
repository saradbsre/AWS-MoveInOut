import React from 'react';
import Barcode from 'react-barcode';
import ReportHeader from '@/assets/bsreheader.png';
import '@/styles/ReportView.css';
import { formatDateShort, formatDateTimeLong, getCurrentDateBarcode } from '@/utils/DateFormat';

interface EquipmentItem {
  id: string;
  itemno: string;
  itemname: string;
  unit: string;
  qty: number;
  status: "good" | "not working";
  remarks: string;
}
interface ReportData {
  technician: string;
  building: string;
  unit: string;
  tenant: string;
  contractNo: string;
  contract_sdate: string;
  contract_edate: string;
  visitType: string;
  submissionDate: Date;
  tenantsignature: string;
  techniciansignature: string;
  items: EquipmentItem[];
  images: any[];
  videos: any[];
  Reference: string;
  unitNature: string;
  unitType: string;
  emirates: string;
  unit_desc?: string;
}
interface Props {
  reportData: ReportData;
  selectedEquipment: EquipmentItem[];
  fromHistory?: boolean;
  username?: string;
}

export default function CheckListPrint({
  reportData,
  selectedEquipment,
  fromHistory,
  username = 'User'
}: Props) {
  const barcodeValue = `${reportData.visitType}-${reportData.contractNo}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;

  return (
    <div className="print-container max-w-4xl mx-auto bg-white" style={{ position: 'fixed' }}>
      {/* Print-specific styles */}
      <div>
      {/* Header */}
      <div className="w-full">
        <img
          src={ReportHeader}
          alt="ABDULWAHED AHMAD RASHED BIN SHABIB Real Estate"
          className="w-full h-auto object-contain"
        />
      </div>
      <div className="w-full">
        {/* Title */}
        <div className="flex items-center justify-between mb-2 relative">
          <div className="flex-1" />
          <div className="flex items-center justify-center relative">
            <h1 className="text-sm  font-bold text-black text-center">
              Complaint Checklist Report
            </h1>
          </div>
          <div className="flex-1 flex items-center justify-end"></div>
        </div>
        {/* Reference, Barcode, Date */}
        <div
          className="flex items-start justify-between w-full mb-2 text-base font-semibold"
          style={{ fontSize: 14 }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <span>
              Reference No: <span className="text-left">{reportData.Reference}</span>
            </span>
            <div className="barcode-print-size flex items-center barcode-print-only" style={{ marginTop: 2 }}>
              <Barcode
                value={barcodeValue}
                width={1}
                height={25}
                fontSize={12}
                displayValue={false}
              />
            </div>
          </div>
          <span style={{ alignSelf: "flex-start" }}>
            Date: <span className="text-right">
              {new Date(reportData.submissionDate).toLocaleString()}
            </span>
          </span>
        </div>
        {/* Report Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black bg-white no-wrap-table">
            <tbody>
              <tr>
                <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Tenant</td>
                <td className="w-1/2 bg-white p-2 text-xs font-normal text-black border border-black" colSpan={5}>{reportData.tenant}</td>
              </tr>
              <tr>
                <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Building</td>
                <td className="w-1/2 bg-white p-2 text-xs font-normal text-black border border-black" colSpan={5}>{reportData.building}</td>
              </tr>
              <tr>
                <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Unit</td>
                <td className="w-1/4 bg-white p-2 text-xs font-normal text-black border border-black">{reportData.unit_desc}</td>
                <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Unit Nature</td>
                <td className="w-1/4 bg-white p-2 text-xs font-normal text-black border border-black">
                  {reportData.unitNature?.toLowerCase() === 'r' ? 'Residential' : reportData.unitNature?.toLowerCase() === 'c' ? 'Commercial' : reportData.unitNature}
                </td>
              </tr>
              <tr>
                <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Unit Type</td>
                <td className="w-1/4 bg-white p-2 text-xs font-normal text-black border border-black">{reportData.unitType}</td>
                <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Visit Type</td>
                <td className="w-1/4 bg-white p-2 text-xs font-normal text-black border border-black">{reportData.visitType}</td>
              </tr>
              <tr>
                <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Contract No</td>
                <td className="w-1/4 bg-white p-2 text-xs font-normal text-black border border-black">{reportData.contractNo}</td>
                <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Start</td>
                <td className="w-1/4 bg-white p-2 text-xs font-normal text-black border border-black">{formatDateShort(reportData.contract_sdate)}</td>
              </tr>
              <tr>
                <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">Emirates</td>
                <td className="w-1/4 bg-white p-2 text-xs font-normal text-black border border-black">{reportData.emirates}</td>
                <td className="w-1/6 bg-white p-2 text-xs font-bold text-black border border-black">End Date</td>
                <td className="w-1/4 bg-white p-2 text-xs font-normal text-black border border-black">{formatDateShort(reportData.contract_edate)}</td>
              </tr>
            </tbody>
          </table>
        </div>
       
        {/* Equipment Status Section */}
        <div className="mt-8 mb-4">
          <div className="inline-block">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-black mb-1 text-base border-b-2 border-black w-full">
              Equipment Status:
            </h3>
          </div>
        </div>
        {/* Equipment Checklist Table */}
        <div className="overflow-x-auto max-w-full">
          <table className="min-w-full border-collapse border border-black bg-white table-fixed no-wrap-table">
            <thead className="bg-gray-100">
              <tr>
                <th className="bg-white p-2 text-xs font-bold text-black border border-black w-[5%]">SI No</th>
                <th className="bg-white p-2 text-xs font-bold text-black border border-black w-[40%]">Item Name</th>
                <th className="bg-white p-2 text-xs font-bold text-black border border-black w-[5%]">Unit</th>
                <th className="bg-white p-2 text-xs font-bold text-black border border-black w-[10%]">QTY</th>
                <th className="bg-white p-2 text-xs font-bold text-black border border-black w-[10%]">Status</th>
                <th className="bg-white p-2 text-xs font-bold text-black border border-black w-[30%]">Remarks</th>
              </tr>
            </thead>
           <tbody>
          {selectedEquipment.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-2 border border-black text-center text-xs sm:text-sm text-black font-bold">
                Condition All Good
              </td>
            </tr>
          ) : (
            <>
              {selectedEquipment.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <tr>
                    <td className="px-3 py-2 border border-black text-xs text-black w-[5%] text-center">{idx + 1}</td>
                    <td className="px-3 py-2 border border-black text-xs text-black w-[45%]">{item.itemname}</td>
                    <td className="px-3 py-2 border border-black text-xs text-black text-center w-[5%]">{item.unit}</td>
                    <td className="px-3 py-2 border border-black text-xs text-black w-[5%] text-center">{item.qty}</td>
                    <td className="px-3 py-2 border border-black capitalize text-xs text-black w-[10%] text-center">{item.status}</td>
                    <td className="px-3 py-2 border border-black text-xs text-black w-[30%]">{item.remarks}</td>
                  </tr>
                  {idx === 11 && (
                    <tr className="page-break" aria-hidden="true">
                      <td colSpan={6} style={{ height: 0, padding: 0, border: 'none' }}></td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </tbody>
          </table>
           <div className="print-blank-center print-only">
            THIS SPACE INTENTIONALLY LEFT BLANK
          </div>
        </div>
      </div>
      </div>
      {/* Signature Footer (fixed in print) */}
      <div className="print-footer">
        <div className="footer-col">
          <span className="font-bold text-black text-xs mb-1">ACCEPTED BY:</span>
          <span className="font-bold text-black mb-2 text-xs">{reportData.tenant}</span>
          <div className="border-2 border-black rounded-lg bg-white flex items-center justify-center w-40 h-16 mb-2">
            {reportData.tenantsignature ? (
              <img
                src={reportData.tenantsignature}
                alt="Tenant Signature"
                className="h-12 object-contain"
                style={{ filter: 'none' }}
              />
            ) : (
              <span className="text-gray-500 text-xs">No signature provided</span>
            )}
          </div>
        </div>
        <div className="footer-col">
          <span className="font-bold text-black text-xs mb-1">PREPARED BY:</span>
          <span className="font-bold text-black mb-2 text-xs">{fromHistory ? reportData.technician : (username || 'Technician')}</span>
          <div className="border-2 border-black rounded-lg bg-white flex items-center justify-center w-40 h-16 mb-2">
            {reportData.techniciansignature ? (
              <img
                src={reportData.techniciansignature}
                alt="Technician Signature"
                className="h-12 object-contain"
                style={{ filter: 'none' }}
              />
            ) : (
              <span className="text-gray-500 text-xs">No signature provided</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}