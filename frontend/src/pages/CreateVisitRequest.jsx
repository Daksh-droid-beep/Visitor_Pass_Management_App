import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Phone, Briefcase, Calendar, Clock, Image, AlertTriangle } from 'lucide-react';

const CreateVisitRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: '',
      purpose: 'Business Meeting',
      visitDate: new Date().toISOString().slice(0, 10),
      visitTime: '10:00'
    }
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/auth/employees');
        if (res.data.success) {
          setEmployees(res.data.employees);
        }
      } catch (err) {
        console.error('Error fetching hosts:', err);
        setFetchError('Could not load employee list. Please try again.');
      }
    };
    fetchEmployees();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue('photo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setSubmitError('');
    setLoading(true);

    try {
      // Step 1: Create Visitor Profile (with photo)
      const visitorForm = new FormData();
      visitorForm.append('fullName', data.fullName);
      visitorForm.append('email', data.email);
      visitorForm.append('phone', data.phone || '');
      visitorForm.append('company', data.company || '');
      visitorForm.append('purpose', data.purpose);
      visitorForm.append('hostId', data.hostId);
      if (data.photo) {
        visitorForm.append('photo', data.photo);
      }

      const visitorRes = await api.post('/visitors', visitorForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!visitorRes.data.success) {
        throw new Error(visitorRes.data.message || 'Failed to create visitor profile');
      }

      const visitorId = visitorRes.data.visitor._id;

      // Step 2: Create Appointment
      const appointmentRes = await api.post('/appointments', {
        visitorId,
        employeeId: data.hostId,
        visitDate: data.visitDate,
        visitTime: data.visitTime,
        purpose: data.purpose
      });

      if (appointmentRes.data.success) {
        navigate('/visitor');
      } else {
        throw new Error(appointmentRes.data.message || 'Failed to request appointment');
      }

    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || err.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="space-y-6">
      {/* Back button */}
      <button 
        onClick={() => navigate('/visitor')}
        class="flex items-center text-slate-400 hover:text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors"
      >
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      <div class="glass-panel p-8 rounded-2xl max-w-2xl mx-auto">
        <h3 class="text-xl font-bold text-slate-100 mb-2">Request Visit Pass</h3>
        <p class="text-slate-400 text-xs mb-8">Enter your visitor profile details and book a meeting date with your host.</p>

        {fetchError && (
          <div class="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-350 text-sm">
            {fetchError}
          </div>
        )}

        {submitError && (
          <div class="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 shrink-0 text-rose-450" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} class="space-y-6">
          {/* photo upload */}
          <div class="flex flex-col items-center p-4 bg-slate-950/40 rounded-xl border border-slate-850 border-dashed">
            <div class="w-20 h-20 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" class="w-full h-full object-cover" />
              ) : (
                <Image class="w-6 h-6 text-slate-500" />
              )}
            </div>
            <label class="mt-3 cursor-pointer text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
              Upload Photo Badge
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                class="hidden"
              />
            </label>
            <span class="text-[10px] text-slate-500 mt-1">Accepts PNG, JPG, JPEG up to 5MB</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Visitor Full Name */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Visitor Full Name</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <User class="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Visitor Name"
                  {...register('fullName', { required: 'Visitor name is required' })}
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-700 text-sm outline-none transition-colors"
                />
              </div>
              {errors.fullName && <p class="text-rose-400 text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            {/* Visitor Email */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Visitor Email</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail class="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="visitor@email.com"
                  {...register('email', { 
                    required: 'Visitor email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                  })}
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-700 text-sm outline-none transition-colors"
                />
              </div>
              {errors.email && <p class="text-rose-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Visitor Phone */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Phone Number</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Phone class="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Phone"
                  {...register('phone')}
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-700 text-sm outline-none transition-colors"
                />
              </div>
            </div>

            {/* Visitor Company */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Company / Organization</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Briefcase class="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Company"
                  {...register('company')}
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-700 text-sm outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Designated Host */}
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Designated Host (Employee)</label>
              <select
                {...register('hostId', { required: 'Please select a host employee' })}
                class="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-150 text-sm outline-none transition-colors"
              >
                <option value="">-- Select Host --</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.department || 'General'})
                  </option>
                ))}
              </select>
              {errors.hostId && <p class="text-rose-400 text-xs mt-1">{errors.hostId.message}</p>}
            </div>

            {/* Purpose */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Purpose of Visit</label>
              <input
                type="text"
                placeholder="Meeting, Interview, Delivery"
                {...register('purpose', { required: 'Purpose is required' })}
                class="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-700 text-sm outline-none transition-colors"
              />
              {errors.purpose && <p class="text-rose-400 text-xs mt-1">{errors.purpose.message}</p>}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Visit Date */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Visit Date</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Calendar class="w-4 h-4" />
                </span>
                <input
                  type="date"
                  {...register('visitDate', { required: 'Visit date is required' })}
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-sm outline-none transition-colors"
                />
              </div>
              {errors.visitDate && <p class="text-rose-400 text-xs mt-1">{errors.visitDate.message}</p>}
            </div>

            {/* Visit Time */}
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Visit Time</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Clock class="w-4 h-4" />
                </span>
                <input
                  type="time"
                  {...register('visitTime', { required: 'Visit time is required' })}
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-sm outline-none transition-colors"
                />
              </div>
              {errors.visitTime && <p class="text-rose-400 text-xs mt-1">{errors.visitTime.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Submit Visit Request'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateVisitRequest;
