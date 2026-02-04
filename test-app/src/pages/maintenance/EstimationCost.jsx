import React, { useState, useEffect } from 'react';
import EstimationAuthButtons from '@/components/estimationcostcomponents/EstimationAuthButtons';
import TransactionLoader from '@/components/TransactionLoader';
import EstimationSearchDropdown from '@/components/estimationcostcomponents/EstimationSearchDropdown';
import * as estimationService from '@/services/Transaction/Estimation/Estimationapi';

// Example equipment item structure

const defaultEquipment = [
    { itemno: '', itemname: '', unit: '', qty: 1, amt: '', status: '', remarks: '' }
];

const defaultHeader = {
    tenant: '',
    building: '',
    date: '',
    visitType: '',
    contractNo: '',
    unitNo: '',
    start: '',
    end: '',
    reference: '',
    rejectionRemark: ''
};

const mapHeaderData = (data, formatDateForInput) => ({
    trno: data.Trno || data.trno || '',
    authStatus: data.authStatus || '',
    tenantid: data.tenantCode || '',
    tenant: data.tenant || data.tenantName || data.CTenantName || '',
    building: data.building || data.building_id || data.build_desc || '',
    date: data.submissionDate ? formatDateForInput(data.submissionDate) : (data.date ? formatDateForInput(data.date) : ''),
    visitType: data.visitType || '',
    contractNo: data.contractNo || data.contract_id || data.contract_no || '',
    unitNo: data.unit || data.unit_desc || '',
    start: data.startDate ? formatDateForInput(data.startDate) : (data.start ? formatDateForInput(data.start) : ''),
    end: data.endDate ? formatDateForInput(data.endDate) : (data.end ? formatDateForInput(data.end) : ''),
    reference: data.Reference || data.reference || data.refNum || '',
    rejectionRemark: data.RejectionRemark || data.remarks || ''
});

// Utility to map signature names
const mapSignatureNames = (data) => ({
    preparedName: data.PreparedBy || data.preparedBy || data.header?.preparedBy || '',
    verifiedName: data.VerifiedBy || data.verifiedBy || data.header?.verifiedBy || '',
    approvedName: data.ApprovedBy || data.approvedBy || data.header?.approvedBy || ''
});


export default function EstimationCost({
    EstimationCostData,
    onNewChecklist,
    fromHistory
}) {
    // Safe local reference to props data to avoid accidental ReferenceErrors
    const data = EstimationCostData || {};
    const [header, setHeader] = useState(data.header || defaultHeader);
    const [equipment, setEquipment] = useState(data.equipment || defaultEquipment);
    const [loadingEstimation, setLoadingEstimation] = useState(false);

    const [loadedSrno, setLoadedSrno] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [summary, setSummary] = useState(null);
    const [checkedRows, setCheckedRows] = useState([]);
    const [currentAuthLevel, setCurrentAuthLevel] = useState(data?.authLevel || 1);
    const [currentAuthStatus, setCurrentAuthStatus] = useState(data?.authStatus || '');
    const [loading, setLoading] = useState(false);
    const [signatureNames, setSignatureNames] = useState({
        preparedName: '',
        verifiedName: '',
        approvedName: ''
    });
    // Helper to format Date or date-string into yyyy-mm-dd for input[type=date]
    const formatDateForInput = (d) => {
        if (!d) return '';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '';
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // Populate header and equipment when EstimationCostData is provided/changes
    useEffect(() => {
        if (!EstimationCostData) return;

        // Set auth level and status
        if (data.authLevel !== undefined) {
            setCurrentAuthLevel(data.authLevel);
        }
        if (data.authStatus) {
            setCurrentAuthStatus(data.authStatus);
        }
        setHeader(mapHeaderData(data.header || data, formatDateForInput));
        setSignatureNames(mapSignatureNames(data.header || data));
        
        // Map equipment and fetch prices for items without amt
        if (Array.isArray(data.equipment) && data.equipment.length > 0) {
            
            // Fetch prices for all items and calculate amt
            const fetchAllPrices = async () => {
                const equipmentWithPrices = await Promise.all(
                    data.equipment.map(async (item) => {
                        // Always fetch and store retprice for quantity calculations
                        if (item.itemno) {
                            const price = await fetchItemPrice(item.itemno);
                            if (price !== null) {
                                // If amt already exists, keep it but store retprice
                                if (item.amt && item.amt !== '' && item.amt !== 0 && item.amt !== '0') {
                                    return { ...item, retprice: price };
                                }
                                // Otherwise, calculate amt from retprice
                                const qty = item.qty || 1;
                                const amt = (price * qty).toFixed(2);
                                return { ...item, amt, retprice: price };
                            }
                        }
                        
                        return { ...item, amt: item.amt || '' };
                    })
                );
                
                setEquipment(equipmentWithPrices);
            };
            
            fetchAllPrices();
        } else {
            console.log('No equipment data, using default');
            setEquipment(defaultEquipment);
        }
    }, [EstimationCostData]);

    // Handle auth action callback
    const handleAuthAction = (action, nextLevel, nextStatus) => {
        setCurrentAuthLevel(nextLevel);
        setCurrentAuthStatus(nextStatus);
        setHeader(h => ({ ...h, authStatus: nextStatus }));
        
        // Only reload if accessed directly (not from reports/history)
        if (!fromHistory && (data?.Srno || loadedSrno)) {
            window.location.reload();
        } else if (fromHistory) {
            // If from history, just go back
            if (onNewChecklist) {
                onNewChecklist();
            }
        }
    };

    // Check if current estimation is rejected
    const isRejected = currentAuthLevel === 3 || currentAuthLevel === 5 || 
        currentAuthStatus?.toLowerCase().includes('reject');

    // List of disabled fields
    const isNewEstimation = !data?.Srno && !loadedSrno;
    const disabledFields = [
        'trno','reference','contractNo','tenant','building','unitNo','date','visitType','start','end',
        'itemno','itemname','unit', 'qty','status','remarks'
    ];
    
    // // For existing estimations with Srno, also disable qty
    if (currentAuthLevel != 1){
        disabledFields.push('amt');
    }

    // Helper function to check if a field is disabled
    const isDisabled = field => disabledFields.includes(field);

    const handleHeaderChange = (field, value) => {
        setHeader(header => ({ ...header, [field]: value }));
    };

    // Fetch item price from backend based on itemno
    const fetchItemPrice = async (itemno) => {
        if (!itemno) return null;
        try {
            const response = await estimationService.fetchItemPrice(itemno);
            if (!response.success) {
                console.log('Response not OK');
                return null;
            }
            // const data = await response.json();
            return response.itemPrices || 0;
        } catch (error) {
            console.error('Error fetching item price:', error);
            return null;
        }
    };

    const handleEquipmentChange = async (idx, field, value) => {
        if (field === 'itemno') {
            // When itemno changes, fetch price and store it as retprice
            const price = await fetchItemPrice(value);
            console.log('Fetched price:', price, 'for itemno:', value);
            
            setEquipment(equipment => equipment.map((item, i) => {
                if (i !== idx) return item;
                const qty = item.qty || 1;
                const amt = price !== null ? (price * qty).toFixed(2) : item.amt || '';
                return { ...item, itemno: value, retprice: price, amt };
            }));
        } else if (field === 'qty') {
            // If qty changes, recalculate amt based on retprice from database
            const currentItem = equipment[idx];
            const newQty = value === '' ? 0 : parseInt(value, 10);
            const validQty = isNaN(newQty) ? 0 : newQty;
            
            // Use retprice if available, otherwise fetch it
            let unitPrice = currentItem.retprice;
            
            if (!unitPrice && currentItem.itemno) {
                // Fetch price if not stored yet
                unitPrice = await fetchItemPrice(currentItem.itemno);
            }
            
            // Calculate new amt based on retprice and new qty
            const newAmt = unitPrice ? (unitPrice * validQty).toFixed(2) : '';
            
            setEquipment(equipment => equipment.map((item, i) => {
                if (i !== idx) return item;
                return { ...item, qty: validQty, amt: newAmt, retprice: unitPrice || item.retprice };
            }));
        } else if (field === 'amt') {
            // When amt changes manually, just update it
            setEquipment(equipment => equipment.map((item, i) => {
                if (i !== idx) return item;
                return { ...item, amt: value };
            }));
        } else {
            setEquipment(equipment => equipment.map((item, i) => {
                if (i !== idx) return item;
                return { ...item, [field]: value };
            }));
        }
    };

    const handleAmtBlur = (idx) => {
        // When amt field loses focus, validate against minimum (qty * retprice)
        const currentItem = equipment[idx];
        const enteredAmt = parseFloat(currentItem.amt) || 0;
        const minAmt = (currentItem.retprice || 0) * (currentItem.qty || 1);
        
        // Reset to minimum if entered amount is less than minimum
        if (enteredAmt < minAmt) {
            setEquipment(equipment => equipment.map((item, i) => {
                if (i !== idx) return item;
                return { ...item, amt: minAmt.toFixed(2) };
            }));
        }
    };

    const handleAddEquipmentAt = (idx) => {
        setEquipment(equipment => {
            const newRow = { itemno: '', itemname: '', unit: '', qty: 1, amt: '', status: '', remarks: '' };
            return [
                ...equipment.slice(0, idx + 1),
                newRow,
                ...equipment.slice(idx + 1)
            ];
        });
    };

    const handleAddEquipment = () => {
        setEquipment(equipment => [...equipment, { itemno: '', itemname: '', unit: '', qty: 1, amt: '', status: '', remarks: '' }]);
    };

    const handleRemoveCheckedEquipment = () => {
        setEquipment(equipment => equipment.filter((_, i) => !checkedRows.includes(i)));
        setCheckedRows([]);
    };

    const handleCheckboxChange = (idx, checked) => {
        setCheckedRows(rows => {
            if (checked) {
                return [...rows, idx];
            } else {
                return rows.filter(i => i !== idx);
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/save-estimation-cost`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    header,
                    equipment,
                    srno: data?.Srno || loadedSrno || data?.srno
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // If this was a new estimation (zero cost), redirect back to estimation report
                if (isNewEstimation) {
                    setLoading(false);
                    if (onNewChecklist) {
                        onNewChecklist();
                    }
                    return;
                }
                
                // Only reload if accessed directly (not from reports)
                if (!fromHistory) {
                    window.location.reload();
                } else {
                    // If from history/reports, just update the state without reload
                    const fetchResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/estimation-cost/${result.srno}`, {
                        credentials: 'include'
                    });
                    
                    if (fetchResponse.ok) {
                        const updatedData = await fetchResponse.json();
                        
                        // Update other data
                        setHeader(mapHeaderData(data.header || data, formatDateForInput));
                        setSignatureNames(mapSignatureNames(data.header || data));
                        setCurrentAuthLevel(updatedData.header.authLevel);
                        setCurrentAuthStatus(updatedData.header.authStatus);
                    }
                    setLoading(false);
                }
            } else {
                alert('Error: ' + result.error);
                setLoading(false);
            }
        } catch (error) {
            console.error('Error saving estimation cost:', error);
            alert('Failed to save estimation cost');
            setLoading(false);
        }
    };

    const handleEstimationSelect = async (srno) => {
        setLoadingEstimation(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/estimation-cost/${srno}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                
                // Store the loaded Srno
                setLoadedSrno(data.header.srno);
                // Update auth level and status
                setCurrentAuthLevel(data.header.authLevel);
                setCurrentAuthStatus(data.header.authStatus);
                
                // Map header data
                setHeader(mapHeaderData(data.header || data, formatDateForInput));
                setSignatureNames(mapSignatureNames(data.header || data));
                
                // Map equipment with prices
                if (data.equipment && data.equipment.length > 0) {
                    const equipmentWithPrices = await Promise.all(
                        data.equipment.map(async (item) => {
                            if (item.itemno) {
                                const price = await fetchItemPrice(item.itemno);
                                if (price !== null) {
                                    return { ...item, retprice: price };
                                }
                            }
                            return item;
                        })
                    );
                    setEquipment(equipmentWithPrices);
                } else {
                    setEquipment(defaultEquipment);
                }
            }
        } catch (error) {
            console.error('Error loading estimation:', error);
            alert('Failed to load estimation');
        } finally {
            setLoadingEstimation(false);
        }
    };

    // Ensure at least one equipment row is present
    const defaultRow = { itemno: '', itemname: '', unit: '', qty: 1, amt: '', status: '', remarks: '' };
    const displayEquipment = equipment.length === 0 ? [defaultRow] : equipment;

    return (
        <>
        {loading && <TransactionLoader message="Saving estimation cost..." progressText="Please wait while we process your data" />}
        {loadingEstimation && <TransactionLoader message="Loading estimation..." progressText="Please wait" />}
        <div className="max-w-full w-full mx-auto p-8 bg-white rounded shadow">
            {/* Add search dropdown only when not coming from history/checklist */}
            {!fromHistory && (
                <EstimationSearchDropdown onSelect={handleEstimationSelect} />
            )}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Estimation Cost Form</h2>

            <div className="flex gap-2 items-center">
                <h2 className="text-xl font-bold text-red-600">
                    {header.authStatus || currentAuthStatus || ''}
                </h2>
                <EstimationAuthButtons
                currentAuthLevel={currentAuthLevel}
                currentAuthStatus={currentAuthStatus}
                srno={data?.Srno || loadedSrno}
                onAuthAction={handleAuthAction}
                onBack={fromHistory ? onNewChecklist : undefined}
                showBack={fromHistory}
                loading={loading}
                setLoading={setLoading}
                hasValidData={!!(header.reference && header.reference !== '')}
                equipment={equipment}
                />
            </div>
            </div>

            {/* Display rejection remarks if estimation is rejected */}
            {isRejected && header.rejectionRemark && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-red-800">Rejection Remarks:</h3>
                            <p className="mt-1 text-sm text-red-700">{header.rejectionRemark}</p>
                        </div>
                    </div>
                </div>
            )}

            <form id="estimation-cost-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    {/* First row: TRNO, Reference No., Contract No. */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <div>
                            <label className="block font-medium mb-1">TRNO</label>
                            <input type="text" value={header.trno || ''} onChange={e => handleHeaderChange('trno', e.target.value)} className="border rounded p-2 w-full" required disabled={isDisabled('trno')} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Reference No.</label>
                            <input type="text" value={header.reference} onChange={e => handleHeaderChange('reference', e.target.value)} className="border rounded p-2 w-full" required disabled={isDisabled('reference')} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Contract No.</label>
                            <input type="text" value={header.contractNo} onChange={e => handleHeaderChange('contractNo', e.target.value)} className="border rounded p-2 w-full" required disabled={isDisabled('contractNo')} />
                        </div>
                    </div>
                    {/* Second row: Tenant, Building, Unit No. */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                        <div>
                            <label className="block font-medium mb-1">Tenant</label>
                            <input type="text" value={header.tenant} onChange={e => handleHeaderChange('tenant', e.target.value)} className="border rounded p-2 w-full" required disabled={isDisabled('tenant')} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Building</label>
                            <input type="text" value={header.building} onChange={e => handleHeaderChange('building', e.target.value)} className="border rounded p-2 w-full" required disabled={isDisabled('building')} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Unit No.</label>
                            <input type="text" value={header.unitNo} onChange={e => handleHeaderChange('unitNo', e.target.value)} className="border rounded p-2 w-full" required disabled={isDisabled('unitNo')} />
                        </div>
                    </div>
                    {/* Third row: Date, Visit Type, Start Date, End Date */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                        <div>
                            <label className="block font-medium mb-1">Date</label>
                            <input type="date" value={header.date} onChange={e => handleHeaderChange('date', e.target.value)} className="border rounded p-2 w-full" required disabled={isDisabled('date')} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Visit Type</label>
                            <input type="text" value={header.visitType} onChange={e => handleHeaderChange('visitType', e.target.value)} className="border rounded p-2 w-full" required disabled={isDisabled('visitType')} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Start Date</label>
                            <input type="date" value={header.start} onChange={e => handleHeaderChange('start', e.target.value)} className="border rounded p-2 w-full" required disabled={isDisabled('start')} />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">End Date</label>
                            <input type="date" value={header.end} onChange={e => handleHeaderChange('end', e.target.value)} className="border rounded p-2 w-full" required disabled={isDisabled('end')} />
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block font-medium mb-2 mt-4">Equipment Items</label>
                    {/* <div className="flex gap-2 mb-2">
                        <button type="button" onClick={handleAddEquipment} className="bg-blue-500 text-white px-3 py-1 rounded">Add</button>
                        <button type="button" onClick={handleRemoveCheckedEquipment} className="bg-red-500 text-white px-3 py-1 rounded">Delete</button>
                    </div> */}
                    <table className="w-full border mb-2">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-1">Item No</th>
                                <th className="border p-1">Item Name</th>
                                <th className="border p-1">Unit</th>
                                <th className="border p-1">Qty</th>
                                <th className="border p-1">Amt</th>
                                <th className="border p-1">Status</th>
                                <th className="border p-1">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayEquipment.map((item, idx) => (
                                <tr key={idx} className="hover:bg-blue-50">
                                    <td className="border p-1">
                                        <input type="text" placeholder="Item No" value={item.itemno || ''} onChange={e => handleEquipmentChange(idx, 'itemno', e.target.value)} className="border rounded p-1 w-full" required disabled={isDisabled('itemno')} />
                                    </td>
                                    <td className="border p-1">
                                        <input type="text" placeholder="Item Name" value={item.itemname || ''} onChange={e => handleEquipmentChange(idx, 'itemname', e.target.value)} className="border rounded p-1 w-full" required disabled={isDisabled('itemname')} />
                                    </td>
                                    <td className="border p-1">
                                        <input type="text" placeholder="Unit" value={item.unit || ''} onChange={e => handleEquipmentChange(idx, 'unit', e.target.value)} className="border rounded p-1 w-full" required disabled={isDisabled('unit')} />
                                    </td>
                                    <td className="border p-1">
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            value={item.qty === 0 ? '' : item.qty}
                                            min={0}
                                            onChange={e => handleEquipmentChange(idx, 'qty', e.target.value)}
                                            className="border rounded p-1 w-full"
                                            required
                                            disabled={isDisabled('qty')}
                                        />
                                    </td>
                                    <td className="border p-1">
                                        <input type="number" placeholder="Amt" value={item.amt || ''} min={0} onChange={e => handleEquipmentChange(idx, 'amt', e.target.value)} onBlur={() => handleAmtBlur(idx)} className="border rounded p-1 w-full" required disabled={isDisabled('amt')} />
                                    </td>
                                    <td className="border p-1">
                                        <input type="text" placeholder="Status" value={item.status || ''} onChange={e => handleEquipmentChange(idx, 'status', e.target.value)} className="border rounded p-1 w-full" disabled={isDisabled('status')} />
                                    </td>
                                    <td className="border p-1">
                                        <input type="text" placeholder="Remarks" value={item.remarks || ''} onChange={e => handleEquipmentChange(idx, 'remarks', e.target.value)} className="border rounded p-1 w-full" disabled={isDisabled('remarks')} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Signature boxes below equipment table */}
                    <div className="flex flex-row gap-6 mt-8">
                        <div className="flex flex-col items-start w-1/3">
                            <span className="text-gray-700 text-sm mb-1">{signatureNames.preparedName}</span>
                            <div className="w-40 border-b-2 border-black mb-2"></div>
                            <span className="font-bold text-black text-xs mb-1">Prepared By:</span>
                        </div>
                        <div className="flex flex-col items-start w-1/3">						
                            <span className="text-gray-700 text-sm mb-1">{signatureNames.verifiedName}</span>
                            <div className="w-40 border-b-2 border-black mb-2"></div>
                            <span className="font-bold text-black text-xs mb-1">Verified By:</span>
                        </div>
                        <div className="flex flex-col items-start w-1/3">					
                            <span className="text-gray-700 text-sm mb-1">{signatureNames.approvedName}</span>
                            <div className="w-40 border-b-2 border-black mb-2"></div>
                            <span className="font-bold text-black text-xs mb-1">Approved By:</span>
                        </div>
                    </div>
                </div>
                {/* Submit button moved to header row above */}
            </form>
            {submitted && summary && (
                <div className="mt-6">
                    {/* ...existing code... */}
                </div>
            )}
        </div>
        </>
    );
}