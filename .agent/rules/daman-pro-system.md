---
trigger: always_on
---

# DAMAN PRO SYSTEM | Implementation Guide

## 🏗️ Architecture Overview
The system follows a **Decoupled Client-Server Architecture** optimized for the Google Ecosystem.

- **Frontend:** Next.js (React) application deployed on Vercel or Firebase Hosting.
- **Backend:** Google Apps Script (GAS) acting as a Serverless API.
- **Database/Storage:** Google Sheets (Relational-style) & Google Drive.
- **Authentication:** OAuth2 via Google Identity Services.

## 📂 Project Structure
Keeping folders separate at the root is **highly recommended** for scalability and clean deployment.

```text
daman-pro-system/
├── Backend/               # Google Apps Script Source
│   ├── Code.js            # Main API logic & routing
│   ├── AuthFlow.gs        # OAuth2 & Security handlers
│   ├── OAuth2.gs          # OAuth2 Library (dist)
│   ├── appsscript.json    # GAS Configuration
│   └── package.json       # Clasp scripts & types
├── Frontend/              # Next.js Application
│   ├── app/               # App Router pages
│   ├── components/        # UI Components (React)
│   ├── public/            # Static assets
│   └── next.config.js     # Next.js config
└── Implementation.md      # This guide
```

---

## 🔄 Logic Flow
1. **Request:** Frontend sends a `fetch` request (JSON) to the Google Apps Script Web App URL.
2. **Auth:** Backend checks `OAuth2` token or session.
3. **Processing:** `Code.js` routes the `action` (e.g., `createEmployee`).
4. **Concurrency:** `LockService` prevents data corruption from simultaneous writes.
5. **Data:** Backend reads/writes to Google Sheets using `SpreadsheetApp`.
6. **Response:** Backend returns a JSON object with `status` and `data`.

---

## 🚀 Deployment Commands

### ☁️ Backend (Apps Script)
```powershell
cd Backend
npm install
clasp login
clasp push --watch
```

### 💻 Frontend (Next.js)
```powershell
cd Frontend
npm install
npm run dev
# For production build
npm run build
```

---

## 🛠️ Optimization & Advanced Features

### ⚡ Caching
- **Strategy:** Use `CacheService` in the Backend to store Sheet data for 1-10 minutes.
- **Benefit:** Reduces Google API quota usage and speeds up read operations significantly.

### 🔄 Real-time & Multi-user
- **Conflict Resolution:** Every write operation must use `LockService.getScriptLock()` with a `waitLock(10000)` to ensure only one user modifies the sheet at a time.
- **Duplicate Prevention:** Before appending rows, the system performs a `some()` check on unique identifiers (like `Passport_No` or `License_No`) to ensure no duplicates.

### 📵 Offline Work (NEXT.js)
- **Service Workers:** Enable PWA (Progressive Web App) capabilities in Next.js using `next-pwa`.
- **IndexedDB:** Use `dexie.js` or `localforage` to store data locally when offline and sync to the Backend when the connection is restored.

---

## 🔐 User Roles & Permissions
Implemented via a `User_Roles_Sheet` in the Master Spreadsheet:

| Role | Permissions | Responsibilities |
| :--- | :--- | :--- |
| **Admin** | Read/Write/Delete/Schema | System config, audit logs, full access. |
| **Manager** | Read/Write Employees | Operations management, report generation. |
| **Viewer** | Read Only | Viewing dashboards and schedules. |
| **DP0** | Specific Company Access | Managing specific documentation for assigned companies. |

---

## 💡 Suggestions for Improvement
1. **Serverless Build:** Use Next.js Static Export (`output: 'export'`) if hosting directly on Google Drive/Sites, but prefer standard SSR/ISR for better performance.
2. **Realtime Sync:** Implement a "Refresh Status" polling mechanism or use Firebase Realtime Database for instant notifications across clients.
3. **Audit Log:** Use the `logHistory` function (already in `Code.js`) for every write action to maintain accountability.
