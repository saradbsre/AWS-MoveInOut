# Moveinout Page Documentation

## Location
- Component: `src/pages/moveinout/Moveinout.tsx`
- Style: `src/styles/Moveinout.css`

## Purpose
`Moveinout` is a multi-step checklist workflow used to capture **Move In / Move Out** inspections.

## Features:
- Building and unit selection
- Tenant contract auto-fetch
- Equipment checklist capture
- Image and video attachments
- Tenant and technician signatures
- Barcode + reference generation
- Checklist submission to backend
- Report preview screen after successful save

## Workflow
1. User opens checklist form (`currentView = form`).
2. User selects building and unit.
3. Tenant details are fetched and displayed.
4. User selects checklist type (`Move In` or `Move Out`).
5. User fills equipment conditions and optional media attachments.
6. User moves to tenant signature step (`currentView = tenantSignature`).
7. User moves to technician signature step (`currentView = technicianSignature`).
8. On submit:
   - Component builds report/checklist payload
   - Generates barcode image (base64)
   - Calls checklist save API
   - Navigates to report view (`currentView = report`)

## State Model (Key Local State)
- Selection state: `selectedBuilding`, `selectedUnit`, search terms, dropdown open/close flags
- Tenant state: `tenantInfo`, `tenantLoading`
- Checklist state: `checklistType`, `selectedEquipment`
- Signature state: `tenantSignature`, `tenantSigRef`, `technicianSigRef`
- Media state: `images`, `videos`, modal open/close flags
- Submission/report state: `reportData`, `barcodeValue`, `barcodeBase64`, `loading`
- Validation/error state: `validationErrors`, `showValidationPopup`, `errors`

## Dependencies

### External Packages
Directly used in `Moveinout.tsx`:
- `react` (hooks and rendering)
- `react-signature-canvas` (signature pad)
- `jsbarcode` (barcode rendering to canvas)

Used indirectly via imported service/component dependencies:
- `axios` (inside `Contractapi.tsx` for HTTP calls)

### Internal Module Dependencies
- `@/components/moveinoutcomponents/EquipmentSection`
  - Collects and updates checklist equipment entries (`SelectedItem[]`).
- `@/components/moveinoutcomponents/ImageModal`
  - Handles image file selection and removal.
- `@/components/moveinoutcomponents/VideoModal`
  - Handles video file selection and removal.
- `@/components/ValidationPopup`
  - Displays validation and submission errors.
- `@/services/Transaction/Contract/Contractapi`
  - Data access layer for building/unit/tenant fetch and checklist submission.
- `@/utils/moduleAccess`
  - Permission gate (`canUserAdd('Move &In Register')`).
- `@/utils/DateFormat`
  - Date formatting utility for date display and barcode text.
- `./ReportView`
  - Final report UI rendered after successful submission.
- `../../styles/Moveinout.css`
  - Page-specific styling.

## Backend/API Dependencies
All calls are made through `src/services/Transaction/Contract/Contractapi.tsx` and rely on:
- `VITE_API_URL` (environment variable)

### Endpoints Used by Moveinout
- `GET /api/contract/buildings`
  - Source for building dropdown.
- `GET /api/contract/units?buildingId=...`
  - Source for unit dropdown (based on building).
- `GET /api/contract/tenant?buildingId=...&unitId=...`
  - Auto-populates tenant/contract details.
- `POST /api/contract/insertchecklist` (`multipart/form-data`)
  - Persists checklist payload and attached files.

## Submission Payload (Checklist)
Main fields passed to `saveChecklist`:
- `contract`, `visitType`, `equipment` (stringified JSON)
- `tenantsignature`, `techniciansignature`
- `username`, `tenantCode`, `tenantName`
- `building`, `unit`, `date`, `startDate`, `endDate`
- `barcode`, `refNum`
- `images[]`, `videos[]`

## Validation Rules Implemented
- Form step:
  - Building is required
  - Unit is required
- Tenant signature step:
  - Tenant signature canvas must not be empty
- Technician signature step:
  - Technician signature canvas must not be empty

Validation messages are shown via `ValidationPopup`.

## Generated Identifiers
- `Reference` number is generated from:
  - Contract number + building + unit (sanitized alphanumeric)
  - Submission timestamp (`ddMMyyyyHHmm`)
- `barcodeValue` format:
  - `${visitType}-${contractNo}-${formatDateShort(submissionDate)}`
- `barcodeBase64` is generated with `JsBarcode` and stored for report rendering.

## View Transitions
- `form` -> `tenantSignature` -> `technicianSignature` -> `report`
- Back navigation:
  - `technicianSignature` -> `tenantSignature`
  - `tenantSignature` -> `form`
- Signature canvases are cleared appropriately on back navigation/reset.

## Access Control
- The **Next** button in form view is conditionally shown only when:
  - `canUserAdd('Move &In Register') === true`

## Reset Behavior
`handleNewChecklist()` resets form/session-local data including:
- Selections, checklist type, tenant info
- Equipment, images, videos
- Signatures
- Validation and generic error state
- Report state and view

## Operational Notes
- Media files are currently capped in UI to 10 images and 10 videos.
- Building and unit lists support client-side search filtering.
- A click-outside handler is implemented for building dropdown closure.
- Component stores technician identity from `sessionStorage.getItem('username')`.

## Environment Requirements
- Frontend env must include:
  - `VITE_API_URL`
- Backend must expose required contract routes and accept multipart checklist uploads.
