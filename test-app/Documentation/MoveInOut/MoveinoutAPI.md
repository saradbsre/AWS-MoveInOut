# Moveinout API Documentation

## Scope
This document covers APIs used by the Moveinout flow from:
- `src/pages/moveinout/Moveinout.tsx`
- `src/components/moveinoutcomponents/EquipmentSection.tsx`
- `src/pages/moveinout/ReportView.tsx`

Base URL is read from `VITE_API_URL` in the frontend.

---

## API Summary (Frontend -> Backend)

### 1) Get Buildings
- **Frontend call**: `ContractAPI.getBuildings()`
- **HTTP**: `GET /api/contract/buildings`
- **Backend route**: `backend/src/routes/contractRoutes.js` -> `router.get('/buildings', buildings)`
- **Backend handler**: `contractController.buildings`
- **Success response**:
```json
{
  "success": true,
  "buildings": [
    { "build_id": "...", "build_desc": "..." }
  ]
}
```

### 2) Get Units by Building
- **Frontend call**: `ContractAPI.getUnits(buildingId)`
- **HTTP**: `GET /api/contract/units?buildingId=<id>`
- **Optional query**: `contractId`
- **Backend route**: `router.get('/units', unit)`
- **Backend handler**: `contractController.unit`
- **Success response**:
```json
{
  "success": true,
  "units": [
    { "unit_desc": "..." }
  ]
}
```

### 3) Get Tenant/Contract Info
- **Frontend call**: `ContractAPI.getTenantInfo(buildingId, unitId)`
- **HTTP**: `GET /api/contract/tenant?buildingId=<id>&unitId=<id>`
- **Backend route**: `router.get('/tenant', tenant)`
- **Backend handler**: `contractController.tenant`
- **Success response**:
```json
{
  "success": true,
  "tenantCode": "...",
  "tenantName": "...",
  "contractNo": "...",
  "startDate": "...",
  "endDate": "..."
}
```

### 4) Get Equipment Master Data
- **Frontend call**: `ContractAPI.getEquipment()` (inside `EquipmentSection`)
- **HTTP**: `GET /api/contract/equipments`
- **Backend route**: `router.get('/equipments', equipments)`
- **Backend handler**: `contractController.equipments`
- **Success response**:
```json
{
  "success": true,
  "equipment": [
    {
      "grpcode": "...",
      "sscode": "...",
      "brdcode": "...",
      "subcode": "...",
      "itemno": "...",
      "itemname": "...",
      "majunit": "..."
    }
  ],
  "fieldTypes": ["group", "category", "brand", "subbrand", "itemno"]
}
```

### 5) Save Checklist (Main Submit)
- **Frontend call**: `ContractAPI.saveChecklist(payload)`
- **HTTP**: `POST /api/contract/insertchecklist`
- **Content-Type**: `multipart/form-data`
- **Backend route**:
  - `router.post('/insertchecklist', upload.fields([{ name: 'images' }, { name: 'videos' }]), insertchecklist)`
- **Backend handler**: `contractController.insertchecklist`

#### Multipart fields sent from frontend
- `contract`
- `visitType`
- `equipment` (JSON string)
- `tenantsignature`
- `techniciansignature`
- `username`
- `tenantCode`
- `tenantName`
- `building`
- `unit`
- `date`
- `startDate`
- `endDate`
- `barcode`
- `refNum`
- `subComp_id` (optional)
- `images` (0..n files)
- `videos` (0..n files)

#### Success response
```json
{ "success": true }
```

### 6) Fetch Checklist Details for Report
- **Frontend call**: `axios.get('/api/checklistDetails', { params: { refNum } })` (inside `ReportView`)
- **HTTP**: `GET /api/checklistDetails?refNum=<reference>`
- **Backend location**: `backend/src/server.js` (direct `app.get`)
- **Success response**:
```json
{
  "total": 1,
  "checklistDetails": [
    {
      "contract_id": "...",
      "build_id": "...",
      "build_desc": "...",
      "unit_desc": "...",
      "visitType": "Move In",
      "CTenantName": "...",
      "tenantSignature": "data:image/...",
      "technicianSignature": "data:image/...",
      "itemno": "...",
      "itemname": "...",
      "qty": 1,
      "status": "good",
      "remarks": "...",
      "refNum": "...",
      "images": [1,2,3]
    }
  ]
}
```

### 7) Fetch Checklist Image by Image ID
- **Frontend usage**: `ReportView` constructs image URL `${apiUrl}/api/checklist-image/:id`
- **HTTP**: `GET /api/checklist-image/:id`
- **Backend location**: `backend/src/server.js` (direct `app.get`)
- **Response**: binary image with dynamic `Content-Type` (`mimetype` from DB)

### 8) Check Existing Estimation by Reference
- **Frontend call**: `fetch('/api/check-estimation-exists/:refNum', { credentials: 'include' })`
- **HTTP**: `GET /api/check-estimation-exists/:refNum`
- **Backend location**: `backend/src/server.js` (direct `app.get`)
- **Success response**:
```json
{
  "success": true,
  "exists": true,
  "estimation": {
    "Srno": 123,
    "AuthLevel": 1,
    "AuthStatus": "Pending"
  }
}
```

### 9) Generate Checklist PDF
- **Frontend call**: `fetch('/api/generate-checklist-pdf', { method: 'POST' ... })`
- **HTTP**: `POST /api/generate-checklist-pdf`
- **Backend location**: `backend/src/server.js` (direct `app.post`)
- **Request body**:
```json
{
  "reportData": { "...": "..." },
  "username": "...",
  "barcodeBase64": "data:image/png;base64,..."
}
```
- **Response**: PDF binary stream (`Content-Type: application/pdf`)

### 10) Send Report Email
- **Frontend call**: `fetch('/api/send-report', { method: 'POST' ... })`
- **HTTP**: `POST /api/send-report`
- **Backend location**: `backend/src/server.js` (direct `app.post`)
- **Request body (used fields)**:
```json
{
  "pdfBase64": "...",
  "contractId": "...",
  "tenantName": "...",
  "unitNumber": "...",
  "buildingName": "...",
  "visitType": "Move In",
  "coordinatorName": "...",
  "companyName": "...",
  "contactNumber": "...",
  "emailAddress": "...",
  "subject": "..."
}
```
- **Validation in backend**:
  - `pdfBase64` must be present and decodable
  - `contractId` must be present

---

## API Call Order in Moveinout Flow
1. On page load: `GET /api/contract/buildings`
2. After building select: `GET /api/contract/units`
3. After unit select: `GET /api/contract/tenant`
4. Equipment section ready: `GET /api/contract/equipments`
5. On submit: `POST /api/contract/insertchecklist`
6. On report page load: `GET /api/checklistDetails`
7. Optional report features:
   - `GET /api/check-estimation-exists/:refNum`
   - `POST /api/generate-checklist-pdf`
   - `POST /api/send-report`
   - image fetches via `GET /api/checklist-image/:id`

---

## Notes Found During Code Review
- `Moveinout.tsx` calls APIs through `Contractapi.tsx` for core checklist flow (buildings, units, tenant, equipment, save).
- `ReportView.tsx` uses direct `axios`/`fetch` calls instead of `Contractapi.tsx` for report-specific endpoints.
- `saveChecklist` frontend sends both `images` and `videos`, while backend `insertchecklist` currently processes/compresses `images` explicitly.
- Most service calls include credentials (`withCredentials: true` or `credentials: 'include'`) for session-backed APIs.
