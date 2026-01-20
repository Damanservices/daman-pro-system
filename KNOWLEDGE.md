# DAMAN PRO SYSTEM - Technical Knowledge Base

## 🏗️ Architecture & Concept
The system is built on a **Decoupled Serverless Architecture**. It utilizes the Google Ecosystem for persistence and Firebase for real-time reactivity.

### 1. Technology Stack
- **Languages**: 
  - **Frontend**: JavaScript (ES6+), React.js.
  - **Backend**: Google Apps Script (GAS / JavaScript).
- **Core Frameworks**: 
  - **Next.js 14+** (App Router) for the web interface.
  - **Firebase SDK** for real-time data streaming.
- **Styling**: Vanilla CSS Modules (Premium aesthetics, Glassmorphism).

### 2. Database & Storage
- **Primary Source (Persistent)**: **Google Sheets**. Acts as the relational database. Each company has its own sheet, and master sheets track global data (Companies, Employees, History, Tasks).
- **Secondary Mirror (Real-time)**: **Firebase Realtime Database**. Used to provide instant UI updates. Every backend change in Sheets is pushed to Firebase.
- **File Storage**: Google Drive API (for document uploads/backups).

### 3. Backend (GAS API)
- **Engine**: Google Apps Script acting as a Serverless Web App endpoint.
- **Routing**: `doGet` and `doPost` handle actions like `createEmployee`, `updateRow`, `bulkDelete`, etc.
- **Concurrency**: Uses `LockService` (Script Lock) to prevent race conditions during multi-user writes.
- **Data Integrity**: 
  - **Deduplication**: Automatically checks Passport/ID before creation.
  - **Batch Processing**: Deletions and updates are processed in batches to optimize Google Quota.

### 4. Frontend (Next.js)
- **State Management**: React `useState` and `useMemo`.
- **Live Sync**: `onValue` listeners connect directly to Firebase paths.
- **Auto-Refresh**: Background polling (setInterval) every 60 seconds triggers a fresh fetch from Sheets to ensure parity.
- **Persistence Layer**:
  - `localStorage` stores the active tab, column visibility, theme, and draft form data.
  - **F5-Resilience**: On reload, the app restores its exact state from `localStorage`.

### 5. Connections & Auth
- **Auth Flow**: 
  - **User Login**: OAuth2 via Google Identity Services.
  - **Backend Access**: Signed script execution under the developer's identity (Service Account style) or User Identity depending on deployment.
- **Permissions**: Defined in a `User_Roles` sheet.
  - **Admin**: Full access.
  - **Operation**: Management and reports.
  - **Typist**: Task execution and workflow updates.

### 6. Process Flow
1. **Request**: UI sends JSON payload to GAS Web App URL.
2. **Execution**: GAS locks the sheet, performs calculations (e.g., Expiry + 60 days), and writes to the Sheet.
3. **Mirroring**: GAS pushes the updated row/data to the Firebase REST API.
4. **Broadcast**: Firebase pushes the change to all connected clients instantly.
5. **UI Update**: Clients' `onValue` listeners trigger a re-render without page reload.

### 7. Build & Hosting
- **Frontend Hosting**: Vercel or Firebase Hosting (Static Export or SSR).
- **Backend Hosting**: Google Apps Script (Internal Google Cloud Infrastructure).
- **Build Tooling**: `clasp` (Chrome Apps Script Provider) for local development and version control of GAS code.

### 8. UI/UX Principles
- **Aesthetics**: Glassmorphism, vibrancy, and micro-animations.
- **Data Priority**: Priority column visibility (e.g., `Visa_Last_Date`) is hardcoded in `PREFERRED_ORDER` but remains customizable by the user and saved locally.
- **Sequential Disclosure**: Forms only show next steps (e.g., Medical) once prerequisites (e.g., Entry Date) are met. Advanced flow requires `Approved` status for Contract and Medical before processing the final **Visa Stamp** phase.
- **Dynamic Logic**: Expiry offsets (30/60/90 days) are recalculatable on-the-fly via UI triggers but allow user override for precision.

---
*Document Version: 1.0.0*
*Last Updated: 20/01/2026*
