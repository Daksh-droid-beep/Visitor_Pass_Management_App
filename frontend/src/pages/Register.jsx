import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, AlertTriangle, ArrowRight, User, Mail, Lock, Phone, Briefcase, Camera } from 'lucide-react';

const Register = () => {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      role: 'VISITOR'
    }
  });

  const selectedRole = watch('role');

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue('profilePhoto', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('role', data.role);
    formData.append('phone', data.phone || '');
    if (data.role === 'EMPLOYEE') {
      formData.append('department', data.department || '');
    }
    if (data.profilePhoto) {
      formData.append('profilePhoto', data.profilePhoto);
    }

    const res = await authRegister(formData);
    setLoading(false);

    if (res.success) {
      if (res.requiresVerification) {
        navigate('/verify-otp');
      } else {
        navigate('/login');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div class="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

      <div class="relative z-10 w-full max-w-lg bg-slate-900/50 backdrop-blur-md border border-slate-800/80 p-8 rounded-2xl shadow-2xl">
        <div class="flex flex-col items-center mb-8">
          <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
            <ShieldAlert class="w-6 h-6" />
          </div>
          <h2 class="text-2xl font-bold text-slate-100">Create Account</h2>
          <p class="text-xs text-slate-400 mt-1 font-light">Join VisiFlow Access System today</p>
        </div>

        {error && (
          <div class="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} class="space-y-5">
          {/* Profile Photo Uploader */}
          <div class="flex flex-col items-center mb-6">
            <div class="relative w-20 h-20 rounded-full border-2 border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" class="w-full h-full object-cover" />
              ) : (
                <Camera class="w-6 h-6 text-slate-500" />
              )}
              <label class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <span class="text-[10px] text-white font-bold">UPLOAD</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  class="hidden"
                />
              </label>
            </div>
            <span class="text-xs text-slate-400 mt-2 font-medium">Profile Photo (Optional)</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <User class="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  {...register('name', { required: 'Name is required' })}
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-650 text-sm outline-none transition-colors"
                />
              </div>
              {errors.name && <p class="text-rose-400 text-xs mt-1.5">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail class="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="john@company.com"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                  })}
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-650 text-sm outline-none transition-colors"
                />
              </div>
              {errors.email && <p class="text-rose-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-650 text-sm outline-none transition-colors"
                />
              </div>
              {errors.password && <p class="text-rose-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Phone Number</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Phone class="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  {...register('phone')}
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-650 text-sm outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Role selection */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Role Type</label>
              <select
                {...register('role')}
                class="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-sm outline-none transition-colors"
              >
                <option value="VISITOR">Visitor</option>
                <option value="EMPLOYEE">Employee (Host)</option>
                <option value="SECURITY">Security / Front Desk</option>
              </select>
            </div>

            {/* Department (Conditional on role EMPLOYEE) */}
            {selectedRole === 'EMPLOYEE' && (
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Department</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Briefcase class="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Engineering / Sales"
                    {...register('department', { required: 'Department is required for employees' })}
                    class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-650 text-sm outline-none transition-colors"
                  />
                </div>
                {errors.department && <p class="text-rose-400 text-xs mt-1.5">{errors.department.message}</p>}
              </div>
            )}
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
                Create Account
                <ArrowRight class="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-slate-800/80 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" class="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
