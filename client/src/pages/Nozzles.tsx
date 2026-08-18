import { useState, useEffect } from 'react';
import api from '../services/api';
import { Nozzle, FuelType } from '../types';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export default function Nozzles() {
  const [nozzles, setNozzles] = useState<Nozzle[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editNozzle, setEditNozzle] = useState<Nozzle | null>(null);
  const [form, setForm] = useState({ name: '', fuelType: '', openingMeter: 0 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [nRes, fRes] = await Promise.all([api.get('/nozzles'), api.get('/fuel-types')]);
      setNozzles(nRes.data.data);
      setFuelTypes(fRes.data.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditNozzle(null);
    setForm({ name: '', fuelType: fuelTypes[0]?._id || '', openingMeter: 0 });
    setShowModal(true);
  };

  const openEdit = (n: Nozzle) => {
    setEditNozzle(n);
    setForm({
      name: n.name,
      fuelType: typeof n.fuelType === 'string' ? n.fuelType : n.fuelType._id,
      openingMeter: n.openingMeter,
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name || !form.fuelType) { toast.error('Fill all fields'); return; }
    try {
      if (editNozzle) {
        await api.put(`/nozzles/${editNozzle._id}`, form);
        toast.success('Updated');
      } else {
        await api.post('/nozzles', form);
        toast.success('Created');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete nozzle?')) return;
    try { await api.delete(`/nozzles/${id}`); toast.success('Deleted'); fetchData(); }
    catch { toast.error('Failed'); }
  };

  const getFuelName = (ft: FuelType | string) => typeof ft === 'string' ? ft : ft.name;

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nozzles</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Nozzle</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {nozzles.map((n) => (
          <div key={n._id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{n.name}</h3>
                <p className="text-sm text-zinc-400">{getFuelName(n.fuelType)}</p>
                <div className="mt-2 text-sm">
                  <span className="text-zinc-500">Opening: </span><span>{n.openingMeter}</span>
                  <span className="text-zinc-500 ml-3">Current: </span><span>{n.currentMeter}</span>
                </div>
                <div className="text-sm mt-1">
                  <span className="text-zinc-500">Sold: </span>
                  <span className="font-bold text-[#22C55E]">{(n.currentMeter - n.openingMeter).toFixed(1)} L</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(n)} className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-[#27272A]">
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(n._id)} className="p-1.5 text-zinc-400 hover:text-red-400 rounded hover:bg-[#27272A]">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {nozzles.length === 0 && (
        <div className="card text-center py-12 text-zinc-400">
          <p>No nozzles added yet.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editNozzle ? 'Edit Nozzle' : 'Add Nozzle'}</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Nozzle Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Nozzle 1" className="w-full" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Fuel Type</label>
                <select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })} className="w-full">
                  <option value="">Select fuel type</option>
                  {fuelTypes.map((ft) => (
                    <option key={ft._id} value={ft._id}>{ft.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Opening Meter Reading</label>
                <input type="number" value={form.openingMeter}
                  onChange={(e) => setForm({ ...form, openingMeter: parseFloat(e.target.value) || 0 })}
                  className="w-full" min="0" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={save} className="btn-primary">{editNozzle ? 'Update' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
