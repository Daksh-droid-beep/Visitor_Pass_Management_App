import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api, { BACKEND_URL } from '../services/api';
import { UserCheck, UserX, Clock, Calendar, ShieldCheck, AlertCircle, RefreshCw, Search } from 'lucide-react';

const HostDashboard = () => {
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // stores appointment ID currently processing
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter appointments based on route
  const getFilteredAppointments = () => {
    const path = location.pathname;
    let filtered = appointments;
    if (path === '/host/requests') {
      filtered = appointments.filter(app => app.approvalStatus === 'PENDING');
    } else if (path === '/host/history') {
      filtered = appointments.filter(app => app.approvalStatus !== 'PENDING');
    }
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.visitorId?.fullName?.toLowerCase().includes(query) ||
        app.visitorId?.email?.toLowerCase().includes(query) ||
        app.visitorId?.phone?.toLowerCase().includes(query) ||
        app.visitorId?.company?.toLowerCase().includes(query) ||
        app.purpose?.toLowerCase().includes(query)
      );
    }
    return filtered;
  };
  const filteredAppointments = getFilteredAppointments();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/appointments');
      if (res.data.success) {
        setAppointments(res.data.appointments);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const res = await api.put(`/appointments/${id}/approve`);
      if (res.data.success) {
        // Update list locally to reflect changes immediately
        setAppointments(prev => prev.map(app => 
          app._id === id ? { ...app, approvalStatus: 'APPROVED', visitorId: { ...app.visitorId, status: 'APPROVED' } } : app
        ));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Approval failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to decline this visitor request?')) return;
    setActionLoading(id);
    try {
      const res = await api.put(`/appointments/${id}/reject`);
      if (res.data.success) {
        setAppointments(prev => prev.map(app => 
          app._id === id ? { ...app, approvalStatus: 'REJECTED', visitorId: { ...app.visitorId, status: 'REJECTED' } } : app
        ));
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Rejection failed.');
    } finally {
      setActionLoading(null);
    }
  };

  // Compute host statistics
  const pendingCount = appointments.filter(app => app.approvalStatus === 'PENDING').length;
  const approvedCount = appointments.filter(app => app.approvalStatus === 'APPROVED').length;
  const rejectedCount = appointments.filter(app => app.approvalStatus === 'REJECTED').length;

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-slate-100">Host Management Console</h2>
          <p class="text-slate-400 text-xs mt-1">Review, approve, or decline visit requests scheduled with you.</p>
        </div>
        <button
          onClick={fetchAppointments}
          disabled={loading}
          class="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw class={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Reload List
        </button>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pending Actions</h4>
            <p class="text-2xl font-bold text-amber-450 mt-1">{pendingCount}</p>
          </div>
        </div>

        <div class="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <UserCheck class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Approved Visits</h4>
            <p class="text-2xl font-bold text-emerald-450 mt-1">{approvedCount}</p>
          </div>
        </div>

        <div class="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-450">
            <UserX class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Declined Requests</h4>
            <p class="text-2xl font-bold text-rose-450 mt-1">{rejectedCount}</p>
          </div>
        </div>
      </div>

      {/* Main requests table */}
      <div class="glass-panel rounded-2xl overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 class="text-base font-bold text-slate-100 font-sans">Visitation Requests</h3>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div class="relative min-w-[240px]">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Search class="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search requests by name, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                class="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg text-slate-100 placeholder-slate-600 text-xs outline-none transition-colors"
              />
            </div>
            <span class="text-xs text-indigo-400 font-semibold text-center">{filteredAppointments.length} Total Registered</span>
          </div>
        </div>

        {loading ? (
          <div class="flex items-center justify-center py-20">
            <div class="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div class="flex flex-col items-center justify-center py-20 text-center text-rose-400">
            <AlertCircle class="w-10 h-10 mb-3" />
            <p class="text-sm">{error}</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div class="flex flex-col items-center justify-center py-20 text-center text-slate-500 px-4">
            <UserCheck class="w-10 h-10 mb-3 text-slate-700" />
            <p class="text-sm">
              {location.pathname === '/host/requests' 
                ? 'No pending visitor requests.' 
                : location.pathname === '/host/history'
                ? 'No visitor history found.'
                : 'No visitor bookings assigned to you.'}
            </p>
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-slate-900/30 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-850">
                  <th class="px-6 py-4">Visitor Details</th>
                  <th class="px-6 py-4">Company</th>
                  <th class="px-6 py-4">Scheduled Time</th>
                  <th class="px-6 py-4">Purpose</th>
                  <th class="px-6 py-4">Status</th>
                  <th class="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-850/60">
                {filteredAppointments.map((app) => (
                  <tr key={app._id} class="hover:bg-slate-900/10 transition-colors">
                    {/* Visitor Photo & Info */}
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <img
                          src={
                            app.visitorId?.photo 
                              ? `${BACKEND_URL}/${app.visitorId.photo}` 
                              : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(app.visitorId?.fullName || 'V')}`
                          }
                          alt="Visitor"
                          class="w-10 h-10 rounded-full object-cover border border-slate-800 bg-slate-950"
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(app.visitorId?.fullName || 'V')}`;
                          }}
                        />
                        <div>
                          <h4 class="font-semibold text-slate-200">{app.visitorId?.fullName || 'N/A'}</h4>
                          <p class="text-[11px] text-slate-500 mt-0.5">{app.visitorId?.email}</p>
                          <p class="text-[11px] text-slate-500">{app.visitorId?.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Company */}
                    <td class="px-6 py-4 text-slate-350">{app.visitorId?.company || 'Private/None'}</td>

                    {/* Scheduled Time */}
                    <td class="px-6 py-4">
                      <div class="text-slate-300">
                        {new Date(app.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div class="text-xs text-indigo-400 font-medium mt-0.5">{app.visitTime}</div>
                    </td>

                    {/* Purpose */}
                    <td class="px-6 py-4 text-slate-400 max-w-xs truncate">{app.purpose || 'General'}</td>

                    {/* Status */}
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

                    {/* Approvals */}
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-center gap-2">
                        {app.approvalStatus === 'PENDING' ? (
                          actionLoading === app._id ? (
                            <div class="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApprove(app._id)}
                                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/10"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(app._id)}
                                class="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-500 hover:text-white text-rose-300 rounded-lg text-xs font-semibold transition-all border border-rose-500/20"
                              >
                                Decline
                              </button>
                            </>
                          )
                        ) : (
                          <span class="text-xs text-slate-550 italic">Processed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostDashboard;
