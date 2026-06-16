import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, ArrowRight, AlertTriangle, ArrowLeft } from 'lucide-react';

const OTPVerification = () => {
  const { verificationEmail, verifyOtp, sendOtp } = useAuth();
  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);

  // Send back to register if no email is set in context
  useEffect(() => {
    if (!verificationEmail) {
      navigate('/login');
    }
  }, [verificationEmail, navigate]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otp.length !== 6 || isNaN(otp)) {
      setError('Please enter a valid 6-digit numerical OTP.');
      return;
    }

    setLoading(true);
    const res = await verifyOtp(verificationEmail, otp);
    setLoading(false);

    if (res.success) {
      setSuccess(res.message || 'Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setError(res.message);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError('');
    setSuccess('');
    setResending(true);
    
    const res = await sendOtp(verificationEmail);
    setResending(false);

    if (res.success) {
      setSuccess('A new OTP code has been sent to your email.');
      setTimer(60);
    } else {
      setError(res.message);
    }
  };

  return (
    <div class="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

      <div class="relative z-10 w-full max-w-md bg-slate-900/50 backdrop-blur-md border border-slate-800/80 p-8 rounded-2xl shadow-2xl">
        <button 
          onClick={() => navigate('/login')}
          class="flex items-center text-slate-400 hover:text-slate-200 text-xs font-semibold uppercase tracking-wider mb-6 transition-colors"
        >
          <ArrowLeft class="w-4 h-4 mr-2" />
          Back to login
        </button>

        <div class="flex flex-col items-center mb-8 text-center">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
            <Mail class="w-6 h-6" />
          </div>
          <h2 class="text-2xl font-bold text-slate-100">Verify Email</h2>
          <p class="text-xs text-slate-400 mt-2 leading-relaxed">
            We have sent a 6-digit confirmation code to: <br />
            <strong class="text-indigo-400 font-medium">{verificationEmail}</strong>
          </p>
        </div>

        {error && (
          <div class="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div class="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-start gap-3">
            <ShieldCheck class="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} class="space-y-6">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-450 text-center mb-3">
              Enter 6-Digit OTP Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              class="w-full py-4 text-center bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-2xl font-bold tracking-[8px] text-slate-100 placeholder-slate-800 outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Verify OTP
                <ArrowRight class="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-slate-800/80 text-center text-sm text-slate-400">
          Didn't receive the code?{' '}
          <button
            onClick={handleResend}
            disabled={timer > 0 || resending}
            class="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors disabled:text-slate-600 disabled:pointer-events-none"
          >
            {timer > 0 ? `Resend Code (${timer}s)` : resending ? 'Resending...' : 'Resend Code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
