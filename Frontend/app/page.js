'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './page.module.css';
import { db } from '../lib/firebase';
import { ref, onValue, set, push, onChildAdded, onChildChanged, onChildRemoved } from "firebase/database";

// --- CONFIGURATION ---
const API_URL = 'https://script.google.com/macros/s/AKfycbx_qqGy9F98XECEw7Dne7MnOtnFV6kJOCMyQqpT7TOvkgvBTMmXMl4z-A_dhl6xjp4rqw/exec';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('light');
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [smartActions, setSmartActions] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [schema, setSchema] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('company');
  const [formData, setFormData] = useState({});
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([{ role: 'ai', text: 'Hello! I am your DAMAN AI Assistant. How can I help you today?' }]);
  const [floatingStates, setFloatingStates] = useState({ calendar: false, tasks: false, history: false });
  const [visibleColumns, setVisibleColumns] = useState({});
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('daman-theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('daman-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    console.log('Fetching data from:', API_URL);
    try {
      const endpoints = [
        { action: 'readCompanies', setter: setCompanies },
        { action: 'readEmployees', setter: setEmployees },
        { action: 'readCalendar', setter: setCalendar },
        { action: 'readTasks', setter: setTasks },
        { action: 'readSmartActions', setter: setSmartActions },
        { action: 'readDailyReports', setter: setDailyReports },
        { action: 'readSchema', setter: setSchema },
        { action: 'readHistory', setter: setHistory }
      ];

      const results = await Promise.all(
        endpoints.map(e =>
          fetch(`${API_URL}?action=${e.action}`, {
            method: 'GET',
            mode: 'cors',
            redirect: 'follow'
          })
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            })
            .catch(err => {
              console.error(`Fetch error for ${e.action}:`, err);
              return { status: 'error', message: err.message };
            })
        )
      );

      results.forEach((res, i) => {
        if (res.status === 'success') {
          endpoints[i].setter(res.data);
        } else if (res.status === 'error') {
          console.warn(`API Error for ${endpoints[i].action}:`, res.message);
        }
      });
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Network Error: Could not connect to Google Apps Script. \n\n1. Ensure you have authorized the script. \n2. Check if the deployment URL is still active. \n3. Check CORS settings in your browser.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Listen to Firebase Realtime Database
    const refs = [
      { path: 'companies', setter: setCompanies },
      { path: 'employees', setter: setEmployees },
      { path: 'calendar', setter: setCalendar },
      { path: 'tasks', setter: setTasks },
      { path: 'smartActions', setter: setSmartActions },
      { path: 'dailyReports', setter: setDailyReports },
      { path: 'history', setter: setHistory }
    ];

    const unsubscribers = refs.map(({ path, setter }) => {
      const dbRef = ref(db, path);
      return onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const formatted = Object.entries(data).map(([id, val]) => ({ id, ...val }));
          setter(formatted);
        }
      });
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [fetchData]);

  // Key Listeners for Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleFormChange = (field, value) => {
    const updatedForm = { ...formData, [field]: value };

    const parseDateInput = (str) => {
      if (!str) return null;
      if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts;
          return new Date(`${y}-${m}-${d}`);
        }
      }
      return new Date(str);
    };

    const formatDateInput = (date) => {
      if (!date || isNaN(date.getTime())) return '';
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    };

    const calculateExpiry = (issueField, durationField, expiryField) => {
      const issueDateStr = updatedForm[issueField];
      const durationStr = updatedForm[durationField] || '1 Year';
      if (issueDateStr) {
        const years = parseInt(durationStr) || 1;
        const date = parseDateInput(issueDateStr);
        if (date && !isNaN(date.getTime())) {
          const newDate = new Date(date);
          newDate.setFullYear(newDate.getFullYear() + years);
          updatedForm[expiryField] = formatDateInput(newDate);
        }
      }
    };

    const addDays = (dateField, days, targetField) => {
      const dateStr = updatedForm[dateField];
      if (dateStr) {
        const date = parseDateInput(dateStr);
        if (date && !isNaN(date.getTime())) {
          date.setDate(date.getDate() + days);
          updatedForm[targetField] = formatDateInput(date);
        }
      }
    };

    if (field === 'License_Issue_Date' || field === 'License_Duration' || field === 'manual_durations') {
      calculateExpiry('License_Issue_Date', 'License_Duration', 'License_Expiry');
    }
    if (field === 'Immigration_Issue_Date' || field === 'Immigration_Duration' || field === 'manual_durations') {
      calculateExpiry('Immigration_Issue_Date', 'Immigration_Duration', 'Immigration_Expiry');
    }
    if (field === 'Ejari_Issue_Date' || field === 'Ejari_Duration' || field === 'manual_durations') {
      calculateExpiry('Ejari_Issue_Date', 'Ejari_Duration', 'Ejari_Expiry');
    }

    // Employee auto-calculations (+60 days)
    if (field === 'Visa_Expiry') addDays('Visa_Expiry', 60, 'Visa_Last_Day');
    if (field === 'Labour_Card_Expiry') addDays('Labour_Card_Expiry', 60, 'Labour_Last_Day');
    if (field === 'Visa_Stamp_Expiry_Date') addDays('Visa_Stamp_Expiry_Date', 60, 'Visa_Stamp_Last_Date');

    // Auto-calculate Status for Companies
    if (modalType === 'company') {
      const now = new Date();
      const expiries = [updatedForm.License_Expiry, updatedForm.Immigration_Expiry, updatedForm.Ejari_Expiry];
      const validExpiries = expiries.filter(e => e).map(e => parseDateInput(e));

      if (validExpiries.length > 0) {
        if (validExpiries.some(d => d && d < now)) {
          updatedForm.Status = 'Expired';
        } else if (validExpiries.some(d => d && (d - now) < (30 * 24 * 60 * 60 * 1000))) {
          updatedForm.Status = 'Expiring Soon';
        } else {
          updatedForm.Status = 'Active';
        }
      }
    }

    setFormData(updatedForm);
  };

  const apiCall = async (action, body) => {
    // Duplicate Check
    if (action === 'createEmployee') {
      const exists = employees.some(e => e.Passport_No === body.Passport_No);
      if (exists) {
        alert('Error: Employee with this passport number already exists.');
        return false;
      }
    }
    if (action === 'createCompany') {
      const exists = companies.some(c => c.Company_Name === body.Company_Name);
      if (exists) {
        alert('Error: Company with this name already exists.');
        return false;
      }
    }

    setLoading(true);
    console.log(`Executing ${action}...`, body);

    // Immediate reflection to Firebase RTDB for real-time UI
    const syncToFirebase = async (action, data) => {
      try {
        const pathMap = {
          'createCompany': 'companies',
          'createEmployee': 'employees',
          'createEvent': 'calendar',
          'createTask': 'tasks',
          'createDailyReport': 'dailyReports',
          'updateCompany': 'companies',
          'updateEmployee': 'employees',
          'updateSmartAction': 'smartActions',
          'deleteCompany': 'companies',
          'deleteEmployee': 'employees',
          'deleteEvent': 'calendar'
        };

        const path = pathMap[action];
        if (path) {
          const dbRef = ref(db, path);
          if (action.startsWith('create')) {
            const newRef = push(dbRef);
            await set(newRef, { ...data, id: newRef.key, Created_At: new Date().toISOString() });
          } else if (action.startsWith('update')) {
            const id = data.id || data.rowId;
            if (id) {
              await set(ref(db, `${path}/${id}`), data);
            }
          } else if (action.startsWith('delete')) {
            const id = data.id || data.rowId;
            if (id) {
              await set(ref(db, `${path}/${id}`), null);
            }
          }
        }
      } catch (fError) {
        console.error('Firebase Sync Error:', fError);
      }
    };

    if (body) await syncToFirebase(action, body);

    const url = `${API_URL}?action=${action}`;

    try {
      const fetchOptions = {
        method: body ? 'POST' : 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        redirect: 'follow'
      };

      if (body) {
        fetchOptions.body = JSON.stringify({ ...body, action });
      }

      const res = await fetch(url, fetchOptions);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const result = await res.json();

      if (result.status === 'success') {
        // If successful in Sheets, we can trust the data.
        // RTDB is already updated for immediate feedback.
        return true;
      }
      alert(`Error: ${result.message || 'Action failed'}`);
    } catch (err) {
      console.error('[Network Error]:', err);
      alert('Failed to send data to Google Sheets.\n\nPossible reasons:\n1. The script hasn\'t been authorized (Open Code.js and click Run).\n2. The request was blocked by a browser extension.\n3. CORS preflight failed (Check Console F12).');
    } finally {
      setLoading(false);
    }
    return false;
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    let action = '';
    const isEdit = !!(formData.rowId || formData.id);

    switch (modalType) {
      case 'company': action = isEdit ? 'updateCompany' : 'createCompany'; break;
      case 'employee': action = isEdit ? 'updateEmployee' : 'createEmployee'; break;
      case 'event': action = isEdit ? 'updateEvent' : 'createEvent'; break;
      case 'task': action = isEdit ? 'updateTask' : 'createTask'; break;
      case 'smartAction': action = 'updateSmartAction'; break;
      case 'dailyReport': action = isEdit ? 'updateDailyReport' : 'createDailyReport'; break;
      case 'schemaEntry': action = isEdit ? 'updateSchema' : 'createSchemaField'; break;
    }
    const success = await apiCall(action, formData);
    if (success) setIsModalOpen(false);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} items?`)) return;
    const itemsToDelete = employees.filter(e => selectedIds.includes(e.id));
    const success = await apiCall('bulkDeleteEmployees', { ids: itemsToDelete });
    if (success) setSelectedIds([]);
  };

  const handleSetup = async () => {
    if (confirm('Initialize sheets schema?')) {
      await apiCall('setup', {});
    }
  };

  const handleSeed = async () => {
    if (confirm('Add sample companies and employees for testing?')) {
      await apiCall('seedTestData', {});
    }
  };

  // Sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let items = [];
    switch (activeTab) {
      case 'companies': items = companies; break;
      case 'employees': items = employees; break;
      case 'calendar': items = calendar; break;
      case 'tasks': items = tasks; break;
      case 'smartactions': items = smartActions; break;
      case 'dailyreports': items = dailyReports; break;
      case 'schema': items = schema; break;
      case 'history': items = history; break;
      default: items = [];
    }

    if (selectedCompany && activeTab === 'employees') {
      items = items.filter(e => e.Company_Name === selectedCompany.Company_Name);
    }

    // Search filter
    items = items.filter(item =>
      Object.values(item).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
    );

    // Sort
    if (sortConfig.key) {
      items.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [companies, employees, calendar, tasks, smartActions, dailyReports, schema, activeTab, selectedCompany, search, sortConfig]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedData.length) setSelectedIds([]);
    else setSelectedIds(sortedData.map(d => d.id));
  };

  // Render Logic
  const getFields = () => {
    let fields = [];
    switch (modalType) {
      case 'company': fields = ["Company_Name", "License_No", "License_Place", "License_Issue_Date", "License_Duration", "License_Expiry", "Immigration_Issue_Date", "Immigration_Duration", "Immigration_Expiry", "Ejari_Issue_Date", "Ejari_Duration", "Ejari_Expiry", "Sponsor_Name", "Signatory_Auth", "Status"]; break;
      case 'employee': fields = ["Employee_Name", "Company_Name", "Residence_Status", "Designation", "Passport_No", "Passport_Expiry", "Visa_No", "Visa_Expiry", "Visa_Last_Day", "Labour_Card_No", "Labour_Card_Expiry", "Labour_Last_Day", "Emirates_ID_No", "Emirates_ID_Expiry", "Visa_Stamp", "Visa_Stamp_Expiry_Date", "Visa_Stamp_Last_Date", "Status", "Workflow_Stage"]; break;
      case 'event': fields = ["Event Name", "Date", "Duration", "Description", "Category", "Status"]; break;
      case 'task': fields = ["Task Name", "Priority", "Due Date", "Assigned To", "Status", "Company"]; break;
      case 'dailyReport': fields = ["Title", "Description", "Assigned_To", "Related_Employee", "Status", "Due_Date"]; break;
      case 'schemaEntry': fields = ["Sheet", "Field", "Type", "Required", "Visible"]; break;
      default: fields = [];
    }
    // Hide auto-calculated expiry fields
    const toHide = ['License_Expiry', 'Immigration_Expiry', 'Ejari_Expiry', 'Visa_Last_Day', 'Labour_Last_Day', 'Visa_Stamp_Last_Date'];
    fields = fields.filter(f => !toHide.includes(f));

    // Outside residence status logic
    if (modalType === 'employee' && formData.Residence_Status === 'Outside') {
      const outsideVisible = ["Employee_Name", "Company_Name", "Residence_Status", "Designation", "Passport_No", "Passport_Expiry", "Status", "Workflow_Stage"];
      fields = fields.filter(f => outsideVisible.includes(f));
    }
    return fields;
  };

  const handleChat = async (e) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim()) return;
    const msg = chatMessage;
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    setChatMessage('');

    setLoading(true);
    const res = await fetch(`${API_URL}?action=chatAI&message=${encodeURIComponent(msg)}`, { method: 'GET', mode: 'cors' });
    const data = await res.json();
    setLoading(false);

    if (data.status === 'success') {
      setChatHistory(prev => [...prev, { role: 'ai', text: data.answer, recs: data.recommendations }]);
    }
  };

  return (
    <div className={styles.mainContainer}>
      <header className={styles.topNav}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>🛡️</div>
          <span className={styles.logoText}>DAMAN PRO</span>
        </div>

        <nav className={styles.menuTabs}>
          {['dashboard', 'companies', 'employees', 'calendar', 'tasks', 'history', 'smartactions', 'dailyreports', 'schema'].map(t => (
            <button
              key={t}
              className={`${styles.tab} ${activeTab === t ? styles.activeTab : ''}`}
              onClick={() => { setActiveTab(t); setSelectedCompany(null); setSelectedIds([]); }}
            >
              {t === 'dailyreports' ? 'Daily' : t === 'smartactions' ? 'A.I' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={handleSetup} className={styles.btnSecondary} style={{ padding: '0.4rem' }}>⚙️ Setup</button>
          <button onClick={handleSeed} className={styles.btnSecondary} style={{ padding: '0.4rem' }}>🧪 Seed</button>
          <button onClick={toggleTheme} className={styles.tab} style={{ fontSize: '1.2rem' }}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <div className={styles.avatar}>A</div>
        </div>
      </header>

      <div className={styles.toolsBar}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            className={styles.searchBox}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {activeTab !== 'dashboard' && activeTab !== 'smartactions' && (
            <button className={styles.btnPrimary} onClick={() => {
              const typeMap = { 'companies': 'company', 'employees': 'employee', 'calendar': 'event', 'tasks': 'task', 'dailyreports': 'dailyReport', 'schema': 'schemaEntry' };
              setModalType(typeMap[activeTab]);
              setFormData(selectedCompany ? { Company_Name: selectedCompany.Company_Name } : {});
              setIsModalOpen(true);
            }}>
              + Add New
            </button>
          )}
          {selectedIds.length > 0 && activeTab === 'employees' && (
            <button className={styles.btnDanger} onClick={handleBulkDelete}>
              🗑️ Delete ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      <main className={`${styles.content} animate-fade`}>
        {activeTab === 'dashboard' && (
          <div className={styles.dashboardGrid}>
            {[
              { label: 'Companies', val: companies.length },
              { label: 'Employees', val: employees.length },
              { label: 'Events', val: calendar.length },
              { label: 'Tasks', val: tasks.length },
              { label: 'Smart Actions', val: smartActions.filter(a => a.Status === 'Active').length }
            ].map(s => (
              <div key={s.label} className={styles.statCard}>
                <div className={styles.statLabel}>{s.label}</div>
                <div className={styles.statValue}>{s.val}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab !== 'dashboard' && (
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className={styles.columnPicker}>
                  <button className={styles.btnSecondary} onClick={() => setIsPickerOpen(!isPickerOpen)}>📊 Columns</button>
                  {isPickerOpen && (
                    <div className={styles.pickerContent}>
                      {sortedData.length > 0 && Object.keys(sortedData[0]).filter(k => k !== 'id' && k !== 'rowId' && k !== 'cached').map(k => (
                        <label key={k} className={styles.pickerItem}>
                          <input
                            type="checkbox"
                            checked={visibleColumns[activeTab]?.[k] !== false}
                            onChange={() => {
                              const current = visibleColumns[activeTab] || {};
                              setVisibleColumns({ ...visibleColumns, [activeTab]: { ...current, [k]: !(current[k] !== false) } });
                            }}
                          />
                          {k.replace(/_/g, ' ')}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === sortedData.length && sortedData.length > 0} />
                    </th>
                    {sortedData.length > 0 && Object.keys(sortedData[0])
                      .filter(k => k !== 'id' && k !== 'rowId' && k !== 'cached')
                      .filter(k => visibleColumns[activeTab]?.[k] !== false)
                      .map(k => (
                        <th key={k} onClick={() => requestSort(k)} style={{ cursor: 'pointer' }}>
                          {k.replace(/_/g, ' ')} {sortConfig.key === k ? (sortConfig.direction === 'asc' ? '▴' : '▾') : ''}
                        </th>
                      ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map(row => (
                    <tr key={row.id} className={selectedIds.includes(row.id) ? styles.rowSelected : ''}>
                      <td><input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)} /></td>
                      {Object.entries(row)
                        .filter(([k]) => k !== 'id' && k !== 'rowId' && k !== 'cached')
                        .filter(([k]) => visibleColumns[activeTab]?.[k] !== false)
                        .map(([k, v], i) => (
                          <td key={i}>
                            {k === 'Status' ? (
                              <span className={`${styles.badge} ${v === 'Active' || v === 'Done' ? styles.badgeSuccess : v === 'Expired' ? styles.badgeDanger : styles.badgeWarning}`}>{String(v)}</span>
                            ) : String(v)}
                          </td>
                        ))}
                      <td className={styles.actionCell}>
                        <button className={styles.btnAction} title="Edit" onClick={() => {
                          const typeMap = { 'companies': 'company', 'employees': 'employee', 'calendar': 'event', 'tasks': 'task', 'dailyreports': 'dailyReport', 'schema': 'schemaEntry' };
                          setModalType(typeMap[activeTab]);
                          setFormData(row);
                          setIsModalOpen(true);
                        }}>✏️</button>
                        <button className={styles.btnAction} title="Delete" onClick={async () => {
                          if (confirm('Are you sure you want to delete this record?')) {
                            const actionMap = { 'companies': 'deleteCompany', 'employees': 'deleteEmployee', 'calendar': 'deleteEvent' };
                            await apiCall(actionMap[activeTab] || 'deleteEmployee', row);
                          }
                        }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {sortedData.length === 0 && <tr><td colSpan="20" style={{ textAlign: 'center', padding: '2rem' }}>No data found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>{modalType === 'smartAction' ? 'Edit' : 'Add'} {modalType ? modalType.toUpperCase() : 'Entry'}</h3>
            <form onSubmit={handleSave} style={{ marginTop: '1rem' }}>
              <div className={styles.formGrid}>
                {getFields().map(f => {
                  // HIDE Logic: Hide 'Company' field if we already selected a company in Employees tab
                  if (f === 'Company' && selectedCompany && modalType === 'employee') return null;

                  // Manual Durations Toggle Checkbox
                  if (modalType === 'company' && f === 'License_Duration') {
                    return (
                      <div key="manual_toggle" className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={formData.manual_durations || false}
                            onChange={e => handleFormChange('manual_durations', e.target.checked)}
                          />
                          Edit Durations Manually (Default 1 Year)
                        </label>
                      </div>
                    );
                  }

                  // Hide Duration fields if not manual
                  if (modalType === 'company' && f.includes('_Duration') && !formData.manual_durations) return null;

                  return (
                    <div key={f} className={styles.formGroup}>
                      <label htmlFor={f}>{f.replace(/_/g, ' ')}</label>
                      {(f === 'Company_Name' || f === 'Company') && modalType === 'employee' ? (
                        <select
                          id={f}
                          name={f}
                          className={styles.selectInput}
                          value={formData[f] || ''}
                          onChange={e => handleFormChange(f, e.target.value)}
                          required
                        >
                          <option value="">Select Company</option>
                          {companies.map(c => <option key={c.id} value={c.Company_Name}>{c.Company_Name}</option>)}
                        </select>
                      ) : f === 'Residence_Status' ? (
                        <select
                          id={f}
                          name={f}
                          className={styles.selectInput}
                          value={formData[f] || ''}
                          onChange={e => handleFormChange(f, e.target.value)}
                          required
                        >
                          <option value="">Select Status</option>
                          <option value="Inside">Inside</option>
                          <option value="Outside">Outside</option>
                        </select>
                      ) : f === 'Status' || f === 'Auto Mode' || f === 'Priority' || f === 'Type' || f.includes('Duration') ? (
                        <select
                          id={f}
                          name={f}
                          className={styles.selectInput}
                          value={formData[f] || (f.includes('Duration') ? '1 Year' : f === 'Status' && modalType === 'company' ? formData.Status : '')}
                          onChange={e => handleFormChange(f, e.target.value)}
                          required
                          disabled={f === 'Status' && modalType === 'company'} // Status is auto-calculated for companies
                        >
                          <option value="">Select...</option>
                          {f === 'Status' && ['Active', 'Inactive', 'Pending', 'Done', 'Expired', 'Expiring Soon'].map(o => <option key={o} value={o}>{o}</option>)}
                          {f === 'Auto Mode' && ['ON', 'OFF'].map(o => <option key={o} value={o}>{o}</option>)}
                          {f === 'Priority' && ['High', 'Medium', 'Low'].map(o => <option key={o} value={o}>{o}</option>)}
                          {f === 'Type' && ['text', 'number', 'email', 'date', 'select', 'checkbox'].map(o => <option key={o} value={o}>{o}</option>)}
                          {f.includes('Duration') && ['1 Year', '2 Years', '3 Years', '5 Years'].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : f === 'License_Issue_Date' ? (
                        <input
                          type="text"
                          id={f}
                          name={f}
                          className={styles.formInput}
                          value={formData[f] || ''}
                          placeholder="dd/mm/yyyy"
                          onChange={e => handleFormChange(f, e.target.value)}
                          required
                        />
                      ) : f.includes('_Date') || f === 'Date' || f === 'Due Date' || f.includes('Expiry') ? (
                        <input
                          type="date"
                          id={f}
                          name={f}
                          className={styles.formInput}
                          value={formData[f] || ''}
                          onChange={e => handleFormChange(f, e.target.value)}
                          required
                        />
                      ) : (
                        <input
                          type="text"
                          id={f}
                          name={f}
                          className={styles.formInput}
                          value={formData[f] || ''}
                          placeholder={f === 'License_Issue_Date' ? 'dd/mm/yyyy' : ''}
                          required={f !== 'Phone' && f !== 'Email' && f !== 'Visible' && f !== 'Required' && f !== 'Status'}
                          disabled={(modalType === 'smartAction' && f === 'Action Name') || (modalType === 'schemaEntry' && (f === 'Sheet' || f === 'Field'))}
                          onChange={e => handleFormChange(f, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className={styles.btnPrimary} style={{ flex: 1 }}>{loading ? 'Processing...' : 'Save'}</button>
                <button type="button" className={styles.btnSecondary} style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Floating AI Assistant */}
      <div className={styles.floatingAi}>
        {isAiOpen && (
          <div className={styles.aiWindow}>
            <div className={styles.aiHeader}>
              <span>🛡️ DAMAN AI Assistant</span>
              <button onClick={() => setIsAiOpen(false)}>×</button>
            </div>
            <div className={styles.aiBody}>
              {chatHistory.map((chat, i) => (
                <div key={i} className={chat.role === 'ai' ? styles.aiMsg : styles.userMsg}>
                  {chat.text}
                  {chat.recs && (
                    <div className={styles.aiRecs}>
                      {chat.recs.map((r, Ri) => <button key={Ri} onClick={() => { setChatMessage(r); handleChat(); }}>{r}</button>)}
                    </div>
                  )}
                </div>
              ))}
              {loading && <div className={styles.aiMsg}>Analyzing data...</div>}
            </div>
            <form onSubmit={handleChat} className={styles.aiInput}>
              <input value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Ask about expiries, trends..." />
              <button type="submit">Send</button>
            </form>
          </div>
        )}
        <button className={styles.aiToggle} onClick={() => setIsAiOpen(!isAiOpen)}>🤖</button>
      </div>

      {/* Floating Icons */}
      <div className={styles.floatingDock}>
        <button onClick={() => setFloatingStates(p => ({ ...p, calendar: !p.calendar }))} title="Calendar">📅</button>
        <button onClick={() => setFloatingStates(p => ({ ...p, tasks: !p.tasks }))} title="Tasks">✅</button>
        <button onClick={() => setFloatingStates(p => ({ ...p, history: !p.history }))} title="History">📜</button>
      </div>

      {/* Floating Windows */}
      {floatingStates.calendar && (
        <div className={styles.floatingWindow}>
          <h4>Calendar <button onClick={() => setFloatingStates(p => ({ ...p, calendar: false }))}>×</button></h4>
          <div className={styles.floatList}>
            {calendar.slice(0, 5).map(e => <div key={e.id}>• {e["Event Name"]} ({e.Date})</div>)}
          </div>
        </div>
      )}
      {floatingStates.tasks && (
        <div className={styles.floatingWindow} style={{ bottom: '130px' }}>
          <h4>Tasks <button onClick={() => setFloatingStates(p => ({ ...p, tasks: false }))}>×</button></h4>
          <div className={styles.floatList}>
            {tasks.slice(0, 5).map(t => <div key={t.id}>• {t["Task Name"]} - {t.Status}</div>)}
          </div>
        </div>
      )}
      {floatingStates.history && (
        <div className={styles.floatingWindow} style={{ bottom: '190px' }}>
          <h4>History <button onClick={() => setFloatingStates(p => ({ ...p, history: false }))}>×</button></h4>
          <div className={styles.floatList}>
            {history.slice(0, 5).map(h => <div key={h.id}>• {h.Action}: {h.Details}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
