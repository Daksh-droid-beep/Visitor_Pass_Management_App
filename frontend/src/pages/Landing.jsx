import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, QrCode, Mail, Clock, ShieldCheck, HeartHandshake } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500">
      {/* Background decoration */}
      <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header class="relative z-10 max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between border-b border-slate-900">
        <div class="flex items-center gap-2">
          <ShieldAlert class="w-8 h-8 text-indigo-500 animate-pulse" />
          <span class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 font-sans tracking-wide">
            VisiFlow
          </span>
        </div>
        <div class="flex gap-4">
          <button 
            onClick={() => navigate('/login')} 
            class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/register')} 
            class="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/20 transition-all glow-btn"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main class="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 flex flex-col items-center text-center">
        <span class="px-4 py-1.5 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-indigo-400 tracking-wider mb-6 uppercase">
          ✦ Secure Visitor Access System ✦
        </span>
        <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] mb-6 font-sans">
          The Premium Way to Manage <br />
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400">
            Visitor Access & Logs
          </span>
        </h1>
        <p class="text-slate-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-light">
          Upgrade from manual logbooks. Implement instant QR-based passes, PDF badge compilation, automated host notification, and robust check-in security workflows.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 mb-20 w-full justify-center">
          <button 
            onClick={() => navigate('/register')} 
            class="px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-xl shadow-xl shadow-indigo-600/20 transition-all glow-btn"
          >
            Register as Visitor
          </button>
          <button 
            onClick={() => navigate('/login')} 
            class="px-8 py-4 text-base font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 transition-all"
          >
            Log In to Portal
          </button>
        </div>

        {/* Feature Grid */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {/* Card 1 */}
          <div class="p-8 rounded-2xl bg-slate-900/40 border border-slate-850 backdrop-blur-md hover:border-slate-800 transition-all text-left">
            <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
              <QrCode class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold text-slate-100 mb-2">Instant QR Passes</h3>
            <p class="text-slate-400 text-sm leading-relaxed">
              When approved, visitor details are instantly converted into a high-security QR Code badge sent directly to their email.
            </p>
          </div>

          {/* Card 2 */}
          <div class="p-8 rounded-2xl bg-slate-900/40 border border-slate-850 backdrop-blur-md hover:border-slate-800 transition-all text-left">
            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
              <Mail class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold text-slate-100 mb-2">Email Notifications</h3>
            <p class="text-slate-400 text-sm leading-relaxed">
              Hosts get instant email prompts to approve or decline bookings, and visitors get dynamic PDFs generated upon approval.
            </p>
          </div>

          {/* Card 3 */}
          <div class="p-8 rounded-2xl bg-slate-900/40 border border-slate-850 backdrop-blur-md hover:border-slate-800 transition-all text-left">
            <div class="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-6">
              <Clock class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold text-slate-100 mb-2">Automated Check Logs</h3>
            <p class="text-slate-400 text-sm leading-relaxed">
              Security scans visitor QR codes at the front desk to immediately log check-in and check-out times, preventing log tamperings.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer class="relative z-10 bg-slate-950 border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-1.5">
            <ShieldCheck class="w-4 h-4 text-indigo-400" />
            <span>VisiFlow Visitor Security Platform &copy; 2026. All rights reserved.</span>
          </div>
          <div class="flex gap-4">
            <a href="#" class="hover:text-slate-350 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" class="hover:text-slate-350 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
