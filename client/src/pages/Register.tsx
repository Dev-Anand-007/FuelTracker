import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Fuel, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({
    pumpName: '', address: '', pumpCode: '', phone: '', password: '', confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        pumpName: form.pumpName,
        address: form.address,
        pumpCode: form.pumpCode,
        phone: form.phone,
        password: form.password,
      });
      login(data.data);
      toast.success('Registration successful');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#22C55E]/10 mb-4">
            <Fuel className="text-[#22C55E]" size={32} />
          </div>
          <h1 className="text-2xl font-bold">FuelTrack</h1>
          <p className="text-zinc-400 text-sm mt-1">Register your petrol pump</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Pump Name</label>
              <input
                type="text"
                value={form.pumpName}
                onChange={(e) => setForm({ ...form, pumpName: e.target.value })}
                placeholder="e.g. Sharma Petrol Pump"
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full address"
                required
                rows={2}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Pump Code</label>
                <input
                  type="text"
                  value={form.pumpCode}
                  onChange={(e) => setForm({ ...form, pumpCode: e.target.value })}
                  placeholder="e.g. SP001"
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone number"
                  required
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="Confirm password"
                required
                className="w-full"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-zinc-400 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-[#22C55E] hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
