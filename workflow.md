# DAMAN PRO System - Workflow & Logic Guide

## ✅ Completed Features
- **Auto-Refresh & Live Sync:** Implemented a continuous live connection via Firebase Realtime Database + a 60-second background Sheet polling mechanism.
- **State Persistence (F5 Proof):** The system now remembers the **Active Tab** and **Column Visibility** settings across browser reloads and sessions.
- **Priority Data Visibility:** Table columns are prioritized to show "Last Date" (autocalculated) and "Auto-filled" data first (e.g., `Visa_Last_Date`, `License_Expiry`).
- **Pagination:** Implemented 50/100/All records per page with navigation.
- **Enhanced Deduplication:** Backend checks for existing Name/Passport during creation and switches to 'Update' automatically.
- **Optimized Bulk Delete:** Batch deletion logic with backwards iteration to prevent index shifting.
- **Searchable Company Select:** Form dropdown includes a filtered search input.
- **Tab Persistence:** Form data saved to `localStorage` per tab/modal type.
- **System Settings:** Management UI for Typist/Operation teams and custom Status dropdowns.

## ⚠️ Problems & In-Progress
- **Realtime Sync Optimization:** Reducing the latency between Sheet write and Firebase reflect (currently ~1-3s).
- **Data Type Casting:** Standardizing all Date strings to ISO-8601 in Firebase for easier sorting.

## 🏢 1. Company Management
- **Duplication:** Prevent Duplicate Company Names.
- **Status:** Auto-calculated (Active/Expired).

## 👥 2. Employee Workflow Logic
### A. Initial Entry
- **Primary Key:** `Employee_Name` & `Passport_No`.
- **Company Selection:** Searchable custom dropdown.

### B. Status Logic & Sequential Form
The form adapts based on `Residence_Status` and `Visa_Status`.
- **Inside Country:** Entry Permit -> Change Status -> Contract -> Medical -> EID -> Visa Stamp Expiry Date -> Visa Stamp Last (= Visa Stamp Expiry Date + 60).
- **Outside Country:** Entry Date -> Contract -> Medical -> EID -> Visa Stamp Expiry Date -> Visa Stamp Last (= Visa Stamp Expiry Date + 60).

**Key Dependencies:**
- **Contract and Medical Submission** must be set to `Approved` to unlock the **Visa Stamp** fields.
- **Visa Status Last Date:** Automatically defaults based on `Visa Status Expiry` + a selectable grace period (30, 60, or 90 days), but remains **fully editable** for manual overrides (Cancellation, Visit Visa, Renewal). Not applicable to `Local` status.

## ⚙️ 3. Technical Architecture (Summary)
- **Sync:** Hybrid (Firebase RTDB Mirror + GAS persistent backend).
- **Persistence:** High reliance on `localStorage` for UI state preservation.
- **Polling:** Background refresh every 60 seconds ensures Sheets vs Mirror consistency.

---
*For deep technical details, see `KNOWLEDGE.md`*
*Last Updated: 20/01/2026*
