import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { BACKEND_URL } from '../services/api';
import QrScanner from 'react-qr-scanner';
import { Scan, Users, Clock, ShieldCheck, AlertCircle, Sparkles, LogIn, LogOut, Search } from 'lucide-react';

const SecurityDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive active tab from location pathname
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/security/scan') return 'scan';
    if (path === '/security/logs') return 'logs';
    return 'approved'; // Default / fallback dashboard (Approved Visitors)
  };
  const activeTab = getActiveTab();

  const handleTabChange = (routePath) => {
    navigate(routePath);
  };
  
  // States for scanning/manual entry
  const [passInput, setPassInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scannerError, setScannerError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
  const [loadingAction, setLoadingAction] = useState(false);
  const [useCamera, setUseCamera] = useState(false);

  // Lists states
  const [approvedAppointments, setApprovedAppointments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [approvedSearchQuery, setApprovedSearchQuery] = useState('');
  const [logsSearchQuery, setLogsSearchQuery] = useState('');

  useEffect(() => {
    if (activeTab === 'approved') {
      fetchApprovedVisitors();
    } else if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const fetchApprovedVisitors = async () => {
    setLoadingList(true);
    try {
      const [appRes, passRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/pass').catch(() => ({ data: { success: true, passes: [] } }))
      ]);

      if (appRes.data.success) {
        const approved = appRes.data.appointments.filter(app => app.approvalStatus === 'APPROVED');
        const passes = passRes.data.passes || [];
        const enriched = approved.map(app => {
          const matchingPass = passes.find(p => p.appointmentId?._id === app._id || p.appointmentId === app._id);
          return {
            ...app,
            pass: matchingPass
          };
        });
        setApprovedAppointments(enriched);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/logs');
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  // QR Code scan callbacks
  const handleScan = (data) => {
    if (data) {
      const text = typeof data === 'object' ? data.text : data;
      try {
        // Try parsing JSON format
        const parsed = JSON.parse(text);
        if (parsed.passNumber) {
          setPassInput(parsed.passNumber);
          setScanResult(parsed);
          setUseCamera(false); // turn off camera after successful capture
        }
      } catch (err) {
        // Fallback to raw text
        setPassInput(text);
        setScanResult({ passNumber: text });
        setUseCamera(false);
      }
    }
  };

  const handleScanError = (err) => {
    console.error('QR Scanner error:', err);
    setScannerError('Could not access camera. Please input the pass code manually.');
  };

  const handleCheckIn = async () => {
    if (!passInput) return;
    setLoadingAction(true);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await api.post('/checkin', { passNumber: passInput });
      if (res.data.success) {
        setActionMessage({
          type: 'success',
          text: res.data.message || `Checked in successfully.`
        });
        setPassInput('');
        setScanResult(null);
      }
    } catch (err) {
      console.error(err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Check-in failed. Please verify pass code.'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCheckOut = async () => {
    if (!passInput) return;
    setLoadingAction(true);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await api.post('/checkout', { passNumber: passInput });
      if (res.data.success) {
        setActionMessage({
          type: 'success',
          text: res.data.message || `Checked out successfully.`
        });
        setPassInput('');
        setScanResult(null);
      }
    } catch (err) {
      console.error(err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Check-out failed. Please verify pass code.'
      });
    } finally {
      setLoadingAction(false);
    }
  };

  // Generate pass manually if it hasn't been generated
  const handleGeneratePassManually = async (appointmentId) => {
    try {
      const res = await api.post('/pass/generate', { appointmentId });
      if (res.data.success) {
        alert(`Pass ${res.data.pass.passNumber} generated successfully!`);
        fetchApprovedVisitors(); // reload
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate pass: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div class="space-y-6">
      {/* Navigation tabs */}
      <div class="flex border-b border-slate-800">
        <button
          onClick={() => handleTabChange('/security/scan')}
          class={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'scan'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scan class="w-4 h-4" />
          Scanner & Gate Control
        </button>
        <button
          onClick={() => handleTabChange('/security')}
          class={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'approved'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users class="w-4 h-4" />
          Approved Visitors
        </button>
        <button
          onClick={() => handleTabChange('/security/logs')}
          class={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'logs'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock class="w-4 h-4" />
          Logs Ledger
        </button>
      </div>

      {/* Tab Content 1: Scanner */}
      {activeTab === 'scan' && (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Scan UI */}
          <div class="glass-panel p-8 rounded-2xl flex flex-col items-center">
            <h3 class="text-lg font-bold text-slate-100 mb-2">Visitor Authentication</h3>
            <p class="text-slate-400 text-xs text-center mb-6">Scan physical/digital QR code or insert Pass Code manually below.</p>

            {/* Camera Toggle */}
            <button
              onClick={() => {
                setUseCamera(!useCamera);
                setScannerError('');
              }}
              class={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all mb-6 ${
                useCamera 
                  ? 'bg-rose-955 text-rose-400 border border-rose-500/20' 
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
              }`}
            >
              {useCamera ? 'Turn Camera Off' : 'Enable Camera Scanner'}
            </button>

            {useCamera && (
              <div class="relative w-full max-w-[280px] aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 mb-6">
                <QrScanner
                  delay={300}
                  onError={handleScanError}
                  onScan={handleScan}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div class="absolute inset-4 border-2 border-indigo-500/40 rounded-lg pointer-events-none animate-pulse"></div>
              </div>
            )}

            {scannerError && (
              <div class="p-3 mb-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-350 text-xs text-center w-full">
                {scannerError}
              </div>
            )}

            {/* Results metadata display */}
            {scanResult && (
              <div class="w-full bg-slate-950/60 p-4 rounded-xl border border-slate-850 text-xs space-y-2 mb-6">
                <div class="flex justify-between">
                  <span class="text-slate-500">Visitor:</span>
                  <span class="text-slate-200 font-bold">{scanResult.visitorName}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Host Host:</span>
                  <span class="text-slate-200">{scanResult.hostName}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Pass Code:</span>
                  <span class="text-indigo-400 font-bold">{scanResult.passNumber}</span>
                </div>
              </div>
            )}

            {/* Manual input */}
            <div class="w-full space-y-4">
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-wider text-slate-450 mb-2">Pass Number</label>
                <input
                  type="text"
                  placeholder="e.g. VP-20260615-1234"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  class="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-700 text-sm outline-none transition-colors"
                />
              </div>

              {/* Action Buttons */}
              <div class="grid grid-cols-2 gap-4">
                <button
                  onClick={handleCheckIn}
                  disabled={loadingAction || !passInput}
                  class="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-850 disabled:text-slate-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/10 transition-all active:scale-[0.98]"
                >
                  <LogIn class="w-4 h-4" />
                  Check-In
                </button>
                <button
                  onClick={handleCheckOut}
                  disabled={loadingAction || !passInput}
                  class="flex items-center justify-center gap-2 py-3 bg-rose-650 hover:bg-rose-600 disabled:bg-slate-850 disabled:text-slate-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-600/10 transition-all active:scale-[0.98]"
                >
                  <LogOut class="w-4 h-4" />
                  Check-Out
                </button>
              </div>
            </div>
          </div>

          {/* Messages Logs Display */}
          <div class="glass-panel p-8 rounded-2xl flex flex-col justify-center items-center text-center">
            {actionMessage.text ? (
              <div class="space-y-4 max-w-sm">
                <div class={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                  actionMessage.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-450' 
                    : 'bg-rose-500/10 text-rose-450'
                }`}>
                  {actionMessage.type === 'success' ? <ShieldCheck class="w-7 h-7" /> : <AlertCircle class="w-7 h-7" />}
                </div>
                <h4 class="text-base font-bold text-slate-150">
                  {actionMessage.type === 'success' ? 'Verification Successful' : 'Verification Error'}
                </h4>
                <p class="text-xs text-slate-400 leading-relaxed">{actionMessage.text}</p>
              </div>
            ) : (
              <div class="text-slate-500 space-y-3 max-w-sm">
                <Sparkles class="w-10 h-10 mx-auto text-slate-800" />
                <h4 class="text-sm font-bold text-slate-400">Waiting for Authentication</h4>
                <p class="text-xs text-slate-500 leading-relaxed">Scan a QR code or submit a valid Pass number code on the left to verify active entries.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 2: Approved Visitors */}
      {activeTab === 'approved' && (
        <div class="glass-panel rounded-2xl overflow-hidden">
          <div class="px-6 py-5 border-b border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 class="text-base font-bold text-slate-100">Approved Visitors Registry</h3>
            <div class="relative min-w-[245px]">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Search class="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search approved by name, host..."
                value={approvedSearchQuery}
                onChange={(e) => setApprovedSearchQuery(e.target.value)}
                class="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg text-slate-100 placeholder-slate-600 text-xs outline-none transition-colors"
              />
            </div>
          </div>

          {loadingList ? (
            <div class="flex items-center justify-center py-20">
              <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : approvedAppointments.length === 0 ? (
            <div class="flex flex-col items-center justify-center py-20 text-center text-slate-500">
              <Users class="w-10 h-10 mb-3 text-slate-700" />
              <p class="text-sm">No approved visitor records found for today.</p>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm border-collapse">
                <thead>
                  <tr class="bg-slate-900/30 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-850">
                    <th class="px-6 py-4">Visitor</th>
                    <th class="px-6 py-4">Company</th>
                    <th class="px-6 py-4">Designated Host</th>
                    <th class="px-6 py-4">Visit Date & Time</th>
                    <th class="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-850/60">
                  {approvedAppointments.filter(app => 
                    app.visitorId?.fullName?.toLowerCase().includes(approvedSearchQuery.toLowerCase()) ||
                    app.visitorId?.email?.toLowerCase().includes(approvedSearchQuery.toLowerCase()) ||
                    app.visitorId?.company?.toLowerCase().includes(approvedSearchQuery.toLowerCase()) ||
                    app.employeeId?.name?.toLowerCase().includes(approvedSearchQuery.toLowerCase()) ||
                    (app.pass && app.pass.passNumber?.toLowerCase().includes(approvedSearchQuery.toLowerCase()))
                  ).map((app) => (
                    <tr key={app._id} class="hover:bg-slate-900/10 transition-colors">
                      <td class="px-6 py-4 font-semibold text-slate-200">
                        <div>
                          <p class="text-slate-100">{app.visitorId?.fullName || 'N/A'}</p>
                          <p class="text-[10px] text-slate-500 mt-0.5">{app.visitorId?.email}</p>
                          {app.pass && (
                            <span class="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold tracking-wider text-indigo-400">
                              {app.pass.passNumber}
                            </span>
                          )}
                        </div>
                      </td>
                      <td class="px-6 py-4 text-slate-400">{app.visitorId?.company || 'N/A'}</td>
                      <td class="px-6 py-4">
                        <div>
                          <p class="text-slate-300">{app.employeeId?.name}</p>
                          <p class="text-[10px] text-slate-500">{app.employeeId?.department}</p>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <p class="text-slate-350">{new Date(app.visitDate).toLocaleDateString()}</p>
                        <p class="text-xs text-indigo-400 mt-0.5">{app.visitTime}</p>
                      </td>
                      <td class="px-6 py-4 text-center">
                        {app.pass ? (
                          <button
                            onClick={() => window.open(`${BACKEND_URL}/api/pass/download/${app.pass.passNumber}`, '_blank')}
                            class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold shadow-md transition-all inline-flex items-center"
                          >
                            Download PDF
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGeneratePassManually(app._id)}
                            class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all inline-flex items-center"
                          >
                            Issue Pass
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Logs */}
      {activeTab === 'logs' && (
        <div class="glass-panel rounded-2xl overflow-hidden">
          <div class="px-6 py-5 border-b border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 class="text-base font-bold text-slate-100">Physical Entry/Exit logs</h3>
            <div class="relative min-w-[245px]">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Search class="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search logs by name, host, officer..."
                value={logsSearchQuery}
                onChange={(e) => setLogsSearchQuery(e.target.value)}
                class="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg text-slate-100 placeholder-slate-600 text-xs outline-none transition-colors"
              />
            </div>
          </div>

          {loadingList ? (
            <div class="flex items-center justify-center py-20">
              <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : logs.length === 0 ? (
            <div class="flex flex-col items-center justify-center py-20 text-center text-slate-500">
              <Clock class="w-10 h-10 mb-3 text-slate-700" />
              <p class="text-sm">No activity logs recorded yet.</p>
            </div>
          ) : (
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm border-collapse">
                <thead>
                  <tr class="bg-slate-900/30 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-850">
                    <th class="px-6 py-4">Visitor</th>
                    <th class="px-6 py-4">Host Employee</th>
                    <th class="px-6 py-4">Check-In Time</th>
                    <th class="px-6 py-4">Check-Out Time</th>
                    <th class="px-6 py-4">Officer on Duty</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-850/60">
                  {logs.filter(log => 
                    log.visitorId?.fullName?.toLowerCase().includes(logsSearchQuery.toLowerCase()) ||
                    log.visitorId?.hostId?.name?.toLowerCase().includes(logsSearchQuery.toLowerCase()) ||
                    log.securityId?.name?.toLowerCase().includes(logsSearchQuery.toLowerCase())
                  ).map((log) => (
                    <tr key={log._id} class="hover:bg-slate-900/10 transition-colors">
                      <td class="px-6 py-4 font-semibold text-slate-200">
                        {log.visitorId?.fullName || 'N/A'}
                      </td>
                      <td class="px-6 py-4">
                        <p class="text-slate-300">{log.visitorId?.hostId?.name || 'N/A'}</p>
                        <p class="text-[10px] text-slate-500">{log.visitorId?.hostId?.department}</p>
                      </td>
                      <td class="px-6 py-4 text-emerald-400 font-medium">
                        {log.checkInTime ? new Date(log.checkInTime).toLocaleString() : 'N/A'}
                      </td>
                      <td class="px-6 py-4 text-rose-450 font-medium">
                        {log.checkOutTime ? new Date(log.checkOutTime).toLocaleString() : (
                          <span class="text-xs bg-emerald-500/10 text-emerald-450 px-2 py-0.5 rounded-full border border-emerald-500/10">Active Inside</span>
                        )}
                      </td>
                      <td class="px-6 py-4 text-slate-400">{log.securityId?.name || 'Security Office'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;
