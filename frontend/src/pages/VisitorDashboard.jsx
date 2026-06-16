import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { BACKEND_URL } from '../services/api';
import { QrCode, Download, Eye, Plus, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const VisitorDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  // Filter appointments based on route path
  const getFilteredAppointments = () => {
    const path = location.pathname;
    if (path === '/visitor/passes') {
      return appointments.filter(app => app.approvalStatus === 'APPROVED');
    }
    return appointments; // Show all on /visitor and /visitor/appointments
  };
  const filteredAppointments = getFilteredAppointments();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      if (res.data.success) {
        setAppointments(res.data.appointments);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewQR = async (appointmentId) => {
    setQrLoading(true);
    setShowQRModal(true);
    try {
      const res = await api.get(`/pass/${appointmentId}`);
      if (res.data.success) {
        setSelectedPass(res.data.pass);
      }
    } catch (err) {
      console.error('Error fetching pass:', err.response?.data?.message || err.message);
      alert('Could not find active pass. It may still be generating or has been deactivated.');
      setShowQRModal(false);
    } finally {
      setQrLoading(false);
    }
  };

  const handleDownloadPDF = (passId) => {
    // Directly trigger window download stream
    window.open(`${BACKEND_URL}/api/pass/download/${passId}`, '_blank');
  };

  // Compute metrics
  const totalRequests = appointments.length;
  const approvedVisits = appointments.filter(app => app.approvalStatus === 'APPROVED').length;
  const pendingVisits = appointments.filter(app => app.approvalStatus === 'PENDING').length;

  return (
    <div class="space-y-6">
      {/* Top Banner */}
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-indigo-900/40 to-slate-900/40 border border-indigo-950 rounded-2xl">
        <div>
          <h2 class="text-xl font-bold text-slate-100">Welcome to VisiFlow</h2>
          <p class="text-slate-400 text-xs mt-1">Pre-register your details and check upcoming appointments here.</p>
        </div>
        <button
          onClick={() => navigate('/visitor/request')}
          class="flex items-center justify-center px-4 py-2.5 bg-indigo-650 hover:bg-indigo-600 rounded-xl text-sm font-semibold transition-colors gap-2 self-start sm:self-auto"
        >
          <Plus class="w-4 h-4" />
          Request New Visit
        </button>
      </div>

      {/* Stats Grid */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <Calendar class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Bookings</h4>
            <p class="text-2xl font-bold text-slate-100 mt-1">{totalRequests}</p>
          </div>
        </div>

        <div class="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Approved Visits</h4>
            <p class="text-2xl font-bold text-emerald-450 mt-1">{approvedVisits}</p>
          </div>
        </div>

        <div class="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pending Approvals</h4>
            <p class="text-2xl font-bold text-amber-450 mt-1">{pendingVisits}</p>
          </div>
        </div>
      </div>

      {/* Appointment History Table */}
      <div class="glass-panel rounded-2xl overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-850">
          <h3 class="text-base font-bold text-slate-155">
            {location.pathname === '/visitor/passes' ? 'Active Passes' : 'My Visit Requests'}
          </h3>
        </div>
        
        {loading ? (
          <div class="flex items-center justify-center py-20">
            <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div class="flex flex-col items-center justify-center py-20 text-center px-4">
            <AlertCircle class="w-10 h-10 text-slate-650 mb-3" />
            <p class="text-slate-400 text-sm">
              {location.pathname === '/visitor/passes' 
                ? 'No active/approved visitor passes found.' 
                : 'No scheduled visits found.'}
            </p>
            {location.pathname !== '/visitor/passes' && (
              <button 
                onClick={() => navigate('/visitor/request')}
                class="text-indigo-400 hover:text-indigo-300 text-xs font-semibold mt-3 underline"
              >
                Book your first appointment
              </button>
            )}
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-slate-900/30 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-850">
                  <th class="px-6 py-4">Host Name</th>
                  <th class="px-6 py-4">Department</th>
                  <th class="px-6 py-4">Visit Date & Time</th>
                  <th class="px-6 py-4">Purpose</th>
                  <th class="px-6 py-4">Status</th>
                  <th class="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-850/60">
                {filteredAppointments.map((app) => (
                  <tr key={app._id} class="hover:bg-slate-900/20 transition-colors">
                    <td class="px-6 py-4 font-semibold text-slate-200">{app.employeeId?.name || 'N/A'}</td>
                    <td class="px-6 py-4 text-slate-400">{app.employeeId?.department || 'General'}</td>
                    <td class="px-6 py-4 text-slate-350">
                      {new Date(app.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} @ {app.visitTime}
                    </td>
                    <td class="px-6 py-4 text-slate-450 max-w-xs truncate">{app.purpose || 'General Visit'}</td>
                    <td class="px-6 py-4">
                      <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        app.approvalStatus === 'APPROVED' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : app.approvalStatus === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {app.approvalStatus}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      {app.approvalStatus === 'APPROVED' ? (
                        <div class="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleViewQR(app._id)}
                            class="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors"
                            title="View pass QR code"
                          >
                            <QrCode class="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewQR(app._id)} // Modal handles download, but we can do directly if pass exists
                            class="p-2 rounded-lg bg-slate-800 hover:bg-slate-705 text-slate-300 transition-colors"
                            title="Open pass view"
                          >
                            <Eye class="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span class="text-xs text-slate-600 italic">Pending approval</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Pass Modal */}
      {showQRModal && (
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div class="relative w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center">
            <h3 class="text-lg font-bold text-slate-100 mb-1">Digital Visitor Pass</h3>
            <p class="text-xs text-slate-400 mb-6">Scan QR code at the reception desk to sign in</p>

            {qrLoading ? (
              <div class="w-48 h-48 flex items-center justify-center border border-slate-850 rounded-xl bg-slate-950/50">
                <div class="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : selectedPass ? (
              <div class="space-y-6 w-full flex flex-col items-center">
                {/* QR Display */}
                <div class="p-3 bg-white rounded-xl border border-slate-800">
                  <img src={selectedPass.qrCode} alt="QR Code" class="w-44 h-44" />
                </div>
                
                {/* Details */}
                <div class="w-full bg-slate-950/60 p-4 rounded-xl border border-slate-850/80 text-xs space-y-2.5">
                  <div class="flex justify-between">
                    <span class="text-slate-500 font-semibold">Pass Number:</span>
                    <span class="text-slate-200 font-bold">{selectedPass.passNumber}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500 font-semibold">Visitor:</span>
                    <span class="text-slate-200">{selectedPass.visitorId?.fullName}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500 font-semibold">Host Host:</span>
                    <span class="text-slate-200">{selectedPass.visitorId?.hostId?.name}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500 font-semibold">Scheduled Date:</span>
                    <span class="text-slate-200">{new Date(selectedPass.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* PDF Download Button */}
                <button
                  onClick={() => handleDownloadPDF(selectedPass.passNumber)}
                  class="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Download class="w-4 h-4" />
                  Download PDF Badge
                </button>
              </div>
            ) : (
              <p class="text-sm text-rose-400">Failed to load pass details.</p>
            )}

            <button
              onClick={() => {
                setShowQRModal(false);
                setSelectedPass(null);
              }}
              class="mt-6 text-xs text-slate-500 hover:text-slate-350 transition-colors uppercase tracking-wider font-semibold"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorDashboard;
