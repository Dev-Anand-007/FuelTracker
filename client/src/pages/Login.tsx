import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Fuel, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [pumpCode, setPumpCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { pumpCode, password });
      login(data.data);
      toast.success('Login successful');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
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
          <p className="text-zinc-400 text-sm mt-1">Petrol Pump Management</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Pump Code</label>
              <input
                type="text"
                value={pumpCode}
                onChange={(e) => setPumpCode(e.target.value)}
                placeholder="Enter pump code"
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
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
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-zinc-400 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#22C55E] hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
