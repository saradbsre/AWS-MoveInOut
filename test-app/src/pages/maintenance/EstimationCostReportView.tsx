import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReportHeader from '@/assets/bsreheader.png'
import ReportFooter from '@/assets/bsrefooter.png'
import { numberToWords } from '@/utils/NumbertoWordConverter';
import '@/styles/EstimationReport.css'

export default function EstimationCostReport() {
  const { srno } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  //   // Remove any existing footer elements and styles
  //   const existingFooters = document.querySelectorAll('.dynamic-page-footer');
  //   const existingStyles = document.querySelectorAll('style[data-footer-style]');
  //   existingFooters.forEach(footer => footer.remove());
  //   existingStyles.forEach(style => style.remove());

  //   // Create footer element
  //   const footer = document.createElement('div');
  //   footer.className = 'dynamic-page-footer';
    
  //   // Create img element properly
  //   const img = document.createElement('img');
  //   img.src = ReportFooter; // Use the imported image directly
  //   img.alt = 'Footer';
  //   img.style.width = '100%';
  //   img.style.height = 'auto';
  //   footer.appendChild(img);
    
  //   // Create CSS for footer positioning
  //   const style = document.createElement('style');
  //   style.setAttribute('data-footer-style', 'true');
  //   style.textContent = `
  //     @media print {
  //       .dynamic-page-footer {
  //         position: fixed;
  //         bottom: 0;
  //         left: 0;
  //         right: 0;
  //         width: 100%;
  //         height: auto;
  //         display: block;
  //         page-break-after: avoid;
  //         z-index: 9999;
  //       }
        
  //       /* Add padding to content to avoid footer overlap */
  //       .print-content {
  //         padding-bottom: 120px !important;
  //       }
        
  //       @page {
  //         margin-bottom: 3cm;
  //       }
  //     }
      
  //     @media screen {
  //       .dynamic-page-footer {
  //         display: none;
  //       }
  //     }
  //   `;
    
  //   document.head.appendChild(style);
  //   document.body.appendChild(footer);

  //   // Cleanup on unmount
  //   return () => {
  //     footer.remove();
  //     style.remove();
  //   };
  // }, []);

  const formatDateForDisplay = (d: string | Date | null | undefined): string => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  const formatNumber = (num: number | string): string => {
    return parseFloat(num as string || '0').toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    const fetchEstimationData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/estimation-cost/${srno}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(result)
          setData(result);
        } else {
          alert('Failed to fetch estimation data');
          window.close();
        }
      } catch (error) {
        console.error('Error fetching estimation:', error);
        alert('Failed to load estimation data');
        window.close();
      } finally {
        setLoading(false);
      }
    };

    if (srno) {
      fetchEstimationData();
    }

    // Close window when print dialog is cancelled or completed
    const handleAfterPrint = () => {
      // Window will close automatically after print/cancel
      window.close();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [srno]);

  useEffect(() => {
    if (!loading && data) {
      // Notify parent window that content is ready
      if (window.opener) {
        window.opener.postMessage('READY_TO_PRINT', '*');
      }
    }
  }, [loading, data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">No data found</div>
      </div>
    );
  }

  const header = data.header || {};
  const equipment = data.equipment || [];
  const totalAmount = equipment.reduce((sum: number, item: any) => sum + (parseFloat(item.amt) || 0), 0);
  const vatamount = equipment.reduce((sum: number, item: any) => sum + (parseFloat(item.taxValue) || 0), 0);
  const grandtotal = equipment.reduce((sum: number, item: any) => sum + (parseFloat(item.amtTotalWithTax) || 0), 0);

  return (
    <div className="print-container">
      {/* Print content */}
      <div className="print-header">
        <img 
          src={ReportHeader}
          alt="ABDULWAHED AHMAD RASHED BIN SHABIB Real Estate" 
          className="w-full h-auto"
        />
      </div>
      <div className="print-content max-w-full w-full mx-auto p-8 bg-white">
        {/* Company Header */}

        {/* Header Information */}
        <div className="mb-6">
          <div className="mb-4">
            <div>
              <span className="">Date:</span> {formatDateForDisplay(new Date())}
            </div>
          </div>

          <div className="">
            <div>
              <span className="">Tenant Name:</span> {header.TenantName}
            </div>
          </div>

          <div className="">
            <div>
              <span className="">Building No:</span> {header.building_id}
            </div>
          </div>

          <div className="">
            <div>
              <span className="">Unit No:</span> {header.unit_desc}
            </div>
          </div>

          <div className="">
            <div>
              <span className="">Contract No:</span> {header.contract_no}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg mb-2 underline">IF YOU DO NOT RECEIVE THIS COMMUNICATION IN FULL, PLEASE CALL US IMMEDIATELY.</h2>
        </div>

        <div className="mb-6">
          <h2 className="text-lg mb-2">You are hereby informed that upon vacating the above-mentioned property, 
            we inspected the premises and found that the maintenance work listed below must be carried out. 
            A 5% VAT will be added to all products in accordance with UAE Government law.
          </h2>
        </div>

        {/* Equipment Table */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">Equipment Items</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-center">SINO</th>
                <th className="border border-gray-300 p-2 text-center">Item Name</th>               
                <th className="border border-gray-300 p-2 text-center">Qty</th>
                <th className="border border-gray-300 p-2 text-center">Rate</th>
                <th className="border border-gray-300 p-2 text-center">Amount</th>
                <th className="border border-gray-300 p-2 text-center">Vat Amount</th>
                <th className="border border-gray-300 p-2 text-center">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                  <td className="border border-gray-300 p-2 text-left">{item.itemname}</td>
                  <td className="border border-gray-300 p-2 text-center">{item.qty}</td>
                  <td className="border border-gray-300 p-2 text-center">{formatNumber(item.retprice)}</td>
                  <td className="border border-gray-300 p-2 text-center">{formatNumber(item.amt)}</td>
                  <td className="border border-gray-300 p-2 text-center">{formatNumber(item.taxValue)}</td>
                  <td className="border border-gray-300 p-2 text-center">{formatNumber(item.amtTotalWithTax)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={4} className="border border-gray-300 p-2 font-bold text-left">Total Amount:</td>
                <td className="border border-gray-300 p-2 text-center">{formatNumber(totalAmount)}</td>
                <td className="border border-gray-300 p-2 text-center">{formatNumber(vatamount)}</td>
                <td className="border border-gray-300 p-2 text-center font-bold">{formatNumber(grandtotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mb-6">
          <h2 className="text-lg mb-2 font-semibold">
            Amount in Words: {numberToWords(grandtotal).toUpperCase()}
          </h2>
        </div>

        <div className="mb-6">
          <h2 className="text-lg mb-2">In case the tenant fails to acknowledge the settlement report within 3 
            days from the issuance date, the maintenance amount specified in the report will be deducted from the 
            security deposit, and the tenant will have no right to claim this amount in the future.
          </h2>
        </div>

        {/* Signatures */}
        <div className="flex justify-between mt-20">
          <div className="text-center">
            <div className="mb-2">{header.preparedBy || ''}</div>
            <div className="border-t-2 border-black w-40 mb-2"></div>
            <div className="font-bold text-sm">Prepared By</div>
          </div>
          <div className="text-center">
            <div className="mb-2">{header.verifiedBy || ''}</div>
            <div className="border-t-2 border-black w-40 mb-2"></div>
            <div className="font-bold text-sm">Verified By</div>
          </div>
          <div className="text-center">
            <div className="mb-2">{header.approvedBy || ''}</div>
            <div className="border-t-2 border-black w-40 mb-2"></div>
            <div className="font-bold text-sm">Approved By</div>
          </div>
        </div>
      </div>
        {/* Footer */}
        <div className="print-footer">
          <img 
            src={ReportFooter}
            alt="Footer" 
            className="w-full h-auto"
          />
        </div>
    </div>
  );
}