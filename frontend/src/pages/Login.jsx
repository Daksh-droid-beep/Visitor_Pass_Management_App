import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, AlertTriangle, ArrowRight, Mail, Lock } from 'lucide-react';

const Login = () => {
  const { login, setVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    
    const res = await login(data.email, data.password);
    setLoading(false);

    if (res.success) {
      // Fetch user profile state handles redirect in App.jsx or we can do it here directly
      // Let's retrieve user role to redirect appropriately
      try {
        const response = await import('../services/api').then(m => m.default.get('/auth/profile'));
        const user = response.data.user;
        switch (user.role) {
          case 'ADMIN':
            navigate('/admin');
            break;
          case 'EMPLOYEE':
            navigate('/host');
            break;
          case 'SECURITY':
            navigate('/security');
            break;
          case 'VISITOR':
          default:
            navigate('/visitor');
            break;
        }
      } catch (err) {
        navigate('/visitor');
      }
    } else if (res.requiresVerification) {
      // Email verification required, redirect to OTP screen
      setVerificationEmail(res.email);
      navigate('/verify-otp');
    } else {
      setError(res.message);
    }
  };

  return (
    <div class="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative">
      {/* Background Orbs */}
      <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

      <div class="relative z-10 w-full max-w-md bg-slate-900/50 backdrop-blur-md border border-slate-800/80 p-8 rounded-2xl shadow-2xl">
        <div class="flex flex-col items-center mb-8">
          <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
            <ShieldAlert class="w-6 h-6" />
          </div>
          <h2 class="text-2xl font-bold text-slate-100">Welcome Back</h2>
          <p class="text-xs text-slate-400 mt-1">Sign in to access your VisiFlow portal</p>
        </div>

        {error && (
          <div class="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} class="space-y-5">
          {/* Email */}
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail class="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="name@company.com"
                {...register('email', { 
                  required: 'Email address is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                })}
                class="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-650 text-sm outline-none transition-colors"
              />
            </div>
            {errors.email && <p class="text-rose-400 text-xs mt-1.5">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock class="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
                class="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-650 text-sm outline-none transition-colors"
              />
            </div>
            {errors.password && <p class="text-rose-400 text-xs mt-1.5">{errors.password.message}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Sign In
                <ArrowRight class="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-slate-800/80 text-center text-sm text-slate-400">
          New visitor?{' '}
          <Link to="/register" class="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
