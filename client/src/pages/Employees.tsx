import { useState, useEffect } from 'react';
import api from '../services/api';
import { Employee } from '../types';
import toast from 'react-hot-toast';
import { Plus, Pencil, X, UserX } from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', joiningDate: '', role: '' });

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees');
      setEmployees(data.data);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditEmp(null);
    setForm({ name: '', phone: '', address: '', joiningDate: new Date().toISOString().split('T')[0], role: '' });
    setShowModal(true);
  };

  const openEdit = (emp: Employee) => {
    setEditEmp(emp);
    setForm({
      name: emp.name, phone: emp.phone, address: emp.address,
      joiningDate: emp.joiningDate.split('T')[0], role: emp.role,
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name || !form.phone || !form.joiningDate || !form.role) {
      toast.error('Fill required fields'); return;
    }
    try {
      if (editEmp) {
        await api.put(`/employees/${editEmp._id}`, form);
        toast.success('Updated');
      } else {
        await api.post('/employees', form);
        toast.success('Added');
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const deactivate = async (id: string) => {
    if (!confirm('Deactivate this employee?')) return;
    try { await api.delete(`/employees/${id}`); toast.success('Deactivated'); fetchEmployees(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Employee</button>
      </div>

      <div className="space-y-3">
        {employees.filter(e => e.isActive).map((emp) => (
          <div key={emp._id} className="card flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{emp.name}</h3>
              <p className="text-sm text-zinc-400">{emp.phone} • {emp.role}</p>
              {emp.address && <p className="text-xs text-zinc-500 mt-0.5">{emp.address}</p>}
              <p className="text-xs text-zinc-500 mt-0.5">Joined: {new Date(emp.joiningDate).toLocaleDateString('en-IN')}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(emp)} className="p-2 text-zinc-400 hover:text-white rounded hover:bg-[#27272A]">
                <Pencil size={14} />
              </button>
              <button onClick={() => deactivate(emp._id)} className="p-2 text-zinc-400 hover:text-red-400 rounded hover:bg-[#27272A]">
                <UserX size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {employees.filter(e => e.isActive).length === 0 && (
        <div className="card text-center py-12 text-zinc-400">
          <p>No employees added yet.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editEmp ? 'Edit Employee' : 'Add Employee'}</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Employee name" className="w-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Phone *</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Phone" className="w-full" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Role *</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full">
                    <option value="">Select role</option>
                    <option value="Operator">Operator</option>
                    <option value="Attendant">Attendant</option>
                    <option value="Manager">Manager</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Address</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Address" className="w-full" />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Joining Date *</label>
                <input type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                  className="w-full" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={save} className="btn-primary">{editEmp ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
