import { useState, useEffect } from 'react';
import api from '../services/api';
import { FuelType, FuelRateWithType, FuelRateHistory } from '../types';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function FuelManagement() {
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [ratesWithTypes, setRatesWithTypes] = useState<FuelRateWithType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingType, setEditingType] = useState<FuelType | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [rateHistory, setRateHistory] = useState<Record<string, FuelRateHistory[]>>({});
  const [showAddRate, setShowAddRate] = useState<string | null>(null);
  const [newRate, setNewRate] = useState('');
  const [newRateDate, setNewRateDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [typesRes, ratesRes] = await Promise.all([
        api.get('/fuel-types'),
        api.get('/fuel-rates/current-all'),
      ]);
      setFuelTypes(typesRes.data.data);
      setRatesWithTypes(ratesRes.data.data);
    } catch {
      toast.error('Failed to load fuel data');
    } finally {
      setLoading(false);
    }
  };

  const addFuelType = async () => {
    if (!newTypeName.trim()) return;
    try {
      await api.post('/fuel-types', { name: newTypeName.trim() });
      toast.success('Fuel type added');
      setNewTypeName('');
      setShowAddType(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add');
    }
  };

  const updateFuelType = async () => {
    if (!editingType || !editName.trim()) return;
    try {
      await api.put(`/fuel-types/${editingType._id}`, { name: editName.trim() });
      toast.success('Updated');
      setEditingType(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const deleteFuelType = async (id: string) => {
    if (!confirm('Delete this fuel type?')) return;
    try {
      await api.delete(`/fuel-types/${id}`);
      toast.success('Deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const loadRateHistory = async (fuelTypeId: string) => {
    if (rateHistory[fuelTypeId]) {
      setExpandedType(expandedType === fuelTypeId ? null : fuelTypeId);
      return;
    }
    try {
      const { data } = await api.get(`/fuel-rates/${fuelTypeId}`);
      setRateHistory({ ...rateHistory, [fuelTypeId]: data.data });
      setExpandedType(fuelTypeId);
    } catch {
      toast.error('Failed to load rate history');
    }
  };

  const addRate = async (fuelTypeId: string) => {
    if (!newRate || !newRateDate) return;
    try {
      await api.post(`/fuel-rates/${fuelTypeId}`, {
        rate: parseFloat(newRate),
        effectiveFrom: newRateDate,
      });
      toast.success('Rate added');
      setNewRate('');
      setNewRateDate(new Date().toISOString().split('T')[0]);
      setShowAddRate(null);
      delete rateHistory[fuelTypeId];
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add rate');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-zinc-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fuel Management</h1>
        <button onClick={() => setShowAddType(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Fuel Type
        </button>
      </div>

      {showAddType && (
        <div className="card flex items-center gap-3">
          <input
            type="text"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            placeholder="Fuel type name (e.g. Diesel)"
            className="flex-1"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && addFuelType()}
          />
          <button onClick={addFuelType} className="btn-primary">Save</button>
          <button onClick={() => { setShowAddType(false); setNewTypeName(''); }} className="btn-secondary">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="space-y-4">
        {ratesWithTypes.map((item) => (
          <div key={item.fuelType._id} className="card">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {editingType?._id === item.fuelType._id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && updateFuelType()}
                    />
                    <button onClick={updateFuelType} className="btn-primary text-sm px-3 py-1">Save</button>
                    <button onClick={() => setEditingType(null)} className="btn-secondary text-sm px-3 py-1">Cancel</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{item.fuelType.name}</h3>
                    <button onClick={() => { setEditingType(item.fuelType); setEditName(item.fuelType.name); }}
                      className="text-zinc-400 hover:text-white">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteFuelType(item.fuelType._id)}
                      className="text-zinc-400 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="mt-2">
                  <span className="text-xs text-zinc-400">Current Rate: </span>
                  <span className="text-xl font-bold text-[#22C55E]">
                    {item.currentRate > 0 ? `₹${item.currentRate}/L` : 'No rate set'}
                  </span>
                </div>
                {item.effectiveFrom && (
                  <p className="text-xs text-zinc-500 mt-1">
                    Effective from {new Date(item.effectiveFrom).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddRate(showAddRate === item.fuelType._id ? null : item.fuelType._id)}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <Plus size={14} /> Change Rate
                </button>
                <button
                  onClick={() => loadRateHistory(item.fuelType._id)}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <Clock size={14} /> History
                  {expandedType === item.fuelType._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {showAddRate === item.fuelType._id && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-[#27272A] rounded-lg">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">New Rate (₹/L)</label>
                  <input
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    placeholder="Rate"
                    className="w-32"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Effective From</label>
                  <input
                    type="date"
                    value={newRateDate}
                    onChange={(e) => setNewRateDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <button onClick={() => addRate(item.fuelType._id)} className="btn-primary mt-5">Save Rate</button>
                <button onClick={() => setShowAddRate(null)} className="btn-secondary mt-5"><X size={14} /></button>
              </div>
            )}

            {expandedType === item.fuelType._id && rateHistory[item.fuelType._id] && (
              <div className="mt-4 p-3 bg-[#27272A] rounded-lg">
                <h4 className="text-sm font-semibold mb-3 text-zinc-300">Rate History</h4>
                {rateHistory[item.fuelType._id].length === 0 ? (
                  <p className="text-zinc-500 text-sm">No rate history</p>
                ) : (
                  <div className="space-y-2">
                    {rateHistory[item.fuelType._id].map((r) => (
                      <div key={r._id} className="flex items-center justify-between py-2 border-b border-[#3F3F46] last:border-0">
                        <span className="text-sm text-zinc-400">
                          {new Date(r.effectiveFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="font-bold text-[#22C55E]">₹{r.rate}/L</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {ratesWithTypes.length === 0 && (
          <div className="card text-center py-12 text-zinc-400">
            <p>No fuel types added yet.</p>
            <p className="text-sm mt-1">Add fuel types to start managing rates.</p>
          </div>
        )}
      </div>
    </div>
  );
}
