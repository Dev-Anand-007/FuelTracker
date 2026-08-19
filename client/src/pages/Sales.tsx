import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Shift, ShiftSale, Nozzle, FuelType, Employee, MiscExpense, ShiftAdjustment } from '../types';
import toast from 'react-hot-toast';
import { Plus, X, Lock, Unlock, Trash2, ChevronDown, ChevronUp, Check, Pencil, Download } from 'lucide-react';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function Sales() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [nozzles, setNozzles] = useState<Nozzle[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedShift, setExpandedShift] = useState<string | null>(null);
  const [showAddSale, setShowAddSale] = useState<string | null>(null);
  const [editingSale, setEditingSale] = useState<{ shiftId: string; sale: any } | null>(null);
  const [showAddExpense, setShowAddExpense] = useState<string | null>(null);
  const [showAddAdjustment, setShowAddAdjustment] = useState<{ shiftId: string; type: 'ADD' | 'SUBTRACT' } | null>(null);

  const [saleForm, setSaleForm] = useState({ nozzleId: '', employeeId: '', openingReading: 0, closingReading: 0 });
  const [expenseForm, setExpenseForm] = useState({ purpose: '', amount: 0 });
  const [adjustmentForm, setAdjustmentForm] = useState({ purpose: '', amount: 0 });
  const [localEdits, setLocalEdits] = useState<Record<string, { testingAmount: string; tiffinAmount: string; cashSubmitted: string; onlineSubmitted: string }>>({});

  useEffect(() => { fetchBase(); }, []);
  useEffect(() => { fetchShifts(); }, [selectedDate]);

  const fetchBase = async () => {
    try {
      const [nRes, fRes, eRes] = await Promise.all([api.get('/nozzles'), api.get('/fuel-types'), api.get('/employees')]);
      setNozzles(nRes.data.data);
      setFuelTypes(fRes.data.data);
      setEmployees(eRes.data.data.filter((e: Employee) => e.isActive));
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const fetchShifts = async () => {
    try {
      const { data } = await api.get(`/shifts?date=${selectedDate}`);
      setShifts(data.data);
      if (data.data.length > 0 && !expandedShift) setExpandedShift(data.data[0]._id);
    } catch { toast.error('Failed to load shifts'); }
  };

  const createShift = async (num: 1 | 2) => {
    try {
      await api.post('/shifts', { shiftNumber: num, date: selectedDate });
      toast.success(`Shift ${num} created`);
      const { data } = await api.get(`/shifts?date=${selectedDate}`);
      setShifts(data.data);
      const newShift = data.data.find((s: Shift) => s.shiftNumber === num);
      if (newShift) setExpandedShift(newShift._id);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const addSale = async (shiftId: string) => {
    if (!saleForm.nozzleId || !saleForm.employeeId || saleForm.closingReading <= saleForm.openingReading) {
      toast.error('Select nozzle, employee, and check readings'); return;
    }
    try {
      await api.post(`/shifts/${shiftId}/sales`, saleForm);
      toast.success('Sale added');
      setShowAddSale(null);
      setSaleForm({ nozzleId: '', employeeId: '', openingReading: 0, closingReading: 0 });
      fetchShifts();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const editSale = async () => {
    if (!editingSale) return;
    if (!saleForm.nozzleId || !saleForm.employeeId || saleForm.closingReading <= saleForm.openingReading) {
      toast.error('Select nozzle, employee, and check readings'); return;
    }
    try {
      await api.put(`/shifts/${editingSale.shiftId}/sales/${editingSale.sale._id}`, saleForm);
      toast.success('Sale updated');
      setEditingSale(null);
      setSaleForm({ nozzleId: '', employeeId: '', openingReading: 0, closingReading: 0 });
      fetchShifts();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const openEditSale = (shiftId: string, sale: any) => {
    setEditingSale({ shiftId, sale });
    setSaleForm({
      nozzleId: typeof sale.nozzle === 'object' ? sale.nozzle._id : sale.nozzle,
      employeeId: typeof sale.employee === 'object' ? sale.employee._id : sale.employee,
      openingReading: sale.openingReading,
      closingReading: sale.closingReading,
    });
  };

  const removeSale = async (shiftId: string, saleId: string) => {
    if (!confirm('Remove this sale?')) return;
    try { await api.delete(`/shifts/${shiftId}/sales/${saleId}`); toast.success('Removed'); fetchShifts(); }
    catch { toast.error('Failed'); }
  };

  const updateSettlement = async (shiftId: string, updates: any) => {
    try { await api.put(`/shifts/${shiftId}/settlement`, updates); fetchShifts(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const addExpense = async (shiftId: string) => {
    if (!expenseForm.purpose || expenseForm.amount <= 0) { toast.error('Fill expense details'); return; }
    const shift = shifts.find(s => s._id === shiftId);
    if (!shift) return;
    const updated = [...(shift.miscExpenses || []), expenseForm];
    await updateSettlement(shiftId, { miscExpenses: updated });
    setExpenseForm({ purpose: '', amount: 0 });
    setShowAddExpense(null);
    toast.success('Expense added');
  };

  const removeExpense = async (shiftId: string, index: number) => {
    const shift = shifts.find(s => s._id === shiftId);
    if (!shift) return;
    const updated = shift.miscExpenses.filter((_: any, i: number) => i !== index);
    await updateSettlement(shiftId, { miscExpenses: updated });
    toast.success('Removed');
  };

  const addAdjustment = async (shiftId: string) => {
    if (!adjustmentForm.purpose || adjustmentForm.amount <= 0) { toast.error('Fill adjustment details'); return; }
    const shift = shifts.find(s => s._id === shiftId);
    if (!shift) return;
    const updated = [...(shift.adjustments || []), { ...adjustmentForm, type: showAddAdjustment!.type }];
    await updateSettlement(shiftId, { adjustments: updated });
    setAdjustmentForm({ purpose: '', amount: 0 });
    setShowAddAdjustment(null);
    toast.success('Adjustment added');
  };

  const removeAdjustment = async (shiftId: string, index: number) => {
    const shift = shifts.find(s => s._id === shiftId);
    if (!shift) return;
    const updated = shift.adjustments.filter((_: any, i: number) => i !== index);
    await updateSettlement(shiftId, { adjustments: updated });
    toast.success('Removed');
  };

  const finalizeShift = async (shiftId: string) => {
    if (!confirm('Finalize this shift? You won\'t be able to edit it.')) return;
    try { await api.put(`/shifts/${shiftId}/finalize`); toast.success('Shift finalized'); fetchShifts(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const reopenShift = async (shiftId: string) => {
    if (!confirm('Reopen this shift for editing?')) return;
    try { await api.put(`/shifts/${shiftId}/reopen`); toast.success('Shift reopened'); fetchShifts(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const getLocal = (shiftId: string, field: string, fallback: number) => {
    return localEdits[shiftId]?.[field as keyof typeof localEdits[string]] ?? (fallback || '');
  };

  const setLocal = (shiftId: string, field: string, value: string) => {
    setLocalEdits(prev => ({
      ...prev,
      [shiftId]: { ...prev[shiftId], [field]: value },
    }));
  };

  const saveLocal = async (shiftId: string, field: string) => {
    const val = Number(localEdits[shiftId]?.[field as keyof typeof localEdits[string]] || 0);
    await updateSettlement(shiftId, { [field]: val });
  };

  const getNozzleName = (n: any) => typeof n === 'object' ? n.name : 'Unknown';
  const getFuelName = (f: any) => typeof f === 'object' ? f.name : 'Unknown';
  const getEmpName = (e: any) => typeof e === 'object' ? e.name : 'Unknown';
  const hasShift1 = shifts.some(s => s.shiftNumber === 1);
  const hasShift2 = shifts.some(s => s.shiftNumber === 2);

  const handlePrint = () => {
    if (shifts.length === 0) { toast.error('No shifts to print'); return; }

    const dateStr = new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    let salesRows = '';
    let settlementHTML = '';
    let grandTotalSales = 0;
    let grandTotalSubmit = 0;

    for (const shift of shifts) {
      salesRows += `
        <tr class="shift-header">
          <td colspan="5">SHIFT ${shift.shiftNumber} &nbsp;&nbsp; ${shift.startTime} - ${shift.endTime} &nbsp;&nbsp; [${shift.status}]</td>
        </tr>`;

      for (const sale of shift.sales) {
        const s = sale as any;
        salesRows += `
          <tr>
            <td>${getFuelName(s.fuelType)}</td>
            <td>${getNozzleName(s.nozzle)}</td>
            <td>${getEmpName(s.employee)}</td>
            <td class="right">${Number(s.quantity).toFixed(2)} L × ₹${Number(s.rate).toFixed(2)}</td>
            <td class="right bold">₹${Number(s.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>`;
      }

      salesRows += `
        <tr class="total-row">
          <td colspan="4">Shift ${shift.shiftNumber} Total</td>
          <td class="right bold">₹${shift.totalSalesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>`;

      grandTotalSales += shift.totalSalesAmount;

      settlementHTML += `
        <div class="shift-section">
          <h3>SHIFT ${shift.shiftNumber} SETTLEMENT</h3>
          <table class="settlement-table">
            <tr><td>Sales Amount</td><td class="right">₹${shift.totalSalesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            ${shift.testingAmount > 0 ? `<tr><td>Testing</td><td class="right minus">- ₹${shift.testingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
            ${shift.tiffinAmount > 0 ? `<tr><td>Tiffin</td><td class="right minus">- ₹${shift.tiffinAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
            ${shift.miscExpenses.length > 0 ? shift.miscExpenses.map((e: any) =>
              `<tr><td>&nbsp;&nbsp;${e.purpose}</td><td class="right minus">- ₹${Number(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>`
            ).join('') : ''}
            ${shift.totalMiscExpense > 0 ? `<tr class="sub-total"><td>Total Misc</td><td class="right minus">- ₹${shift.totalMiscExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>` : ''}
            ${shift.adjustments.filter((a: any) => a.type === 'ADD').map((a: any) =>
              `<tr><td>${a.purpose}</td><td class="right plus">+ ₹${Number(a.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>`
            ).join('')}
            ${shift.adjustments.filter((a: any) => a.type === 'SUBTRACT').map((a: any) =>
              `<tr><td>${a.purpose}</td><td class="right minus">- ₹${Number(a.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>`
            ).join('')}
            <tr class="grand-total"><td>Amount To Submit</td><td class="right">₹${shift.amountToSubmit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            <tr><td>Cash Submitted</td><td class="right">₹${shift.cashSubmitted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            <tr><td>Online Payment</td><td class="right">₹${shift.onlineSubmitted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            <tr class="sub-total"><td>Total Submitted</td><td class="right">₹${shift.totalSubmitted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            <tr class="grand-total"><td>Difference</td><td class="right ${shift.difference === 0 ? '' : shift.difference > 0 ? 'plus' : 'minus'}">
              ${shift.difference === 0 ? 'BALANCED' : shift.difference > 0 ? `EXTRA ₹${shift.difference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : `SHORT ₹${Math.abs(shift.difference).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </td></tr>
          </table>
        </div>`;

      grandTotalSubmit += shift.amountToSubmit;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Report - ${dateStr}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1a1a1a; font-size: 13px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #22C55E; padding-bottom: 15px; }
          .header h1 { font-size: 22px; margin-bottom: 4px; }
          .header .subtitle { font-size: 14px; color: #555; }
          .header .date { font-size: 16px; font-weight: bold; color: #22C55E; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th { background: #f0f0f0; padding: 8px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #ccc; }
          td { padding: 6px 10px; border-bottom: 1px solid #e5e5e5; }
          .right { text-align: right; }
          .bold { font-weight: 700; }
          .shift-header td { background: #22C55E; color: white; font-weight: 700; font-size: 13px; padding: 8px 10px; }
          .total-row td { background: #f8f8f8; font-weight: 600; border-top: 2px solid #22C55E; }
          .shift-section { margin-bottom: 25px; page-break-inside: avoid; }
          .shift-section h3 { font-size: 14px; margin-bottom: 8px; color: #22C55E; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
          .settlement-table td { padding: 5px 10px; }
          .settlement-table .sub-total td { font-weight: 600; border-top: 1px solid #999; }
          .settlement-table .grand-total td { font-weight: 700; font-size: 14px; border-top: 2px solid #22C55E; background: #f0fdf4; }
          .minus { color: #dc2626; }
          .plus { color: #16a34a; }
          .grand-summary { margin-top: 30px; border-top: 3px solid #22C55E; padding-top: 15px; }
          .grand-summary h2 { font-size: 16px; margin-bottom: 10px; }
          .grand-summary table td { padding: 6px 10px; font-size: 14px; }
          .grand-summary .grand-total td { font-size: 16px; background: #f0fdf4; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${user?.pumpName || 'FuelTrack'}</h1>
          <div class="subtitle">Daily Sales Report</div>
          <div class="date">${dateStr}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fuel Type</th>
              <th>Nozzle</th>
              <th>Employee</th>
              <th class="right">Quantity × Rate</th>
              <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${salesRows}
            <tr class="total-row" style="background:#22C55E;color:white;">
              <td colspan="4" style="font-weight:700;">GRAND TOTAL SALES</td>
              <td class="right bold" style="font-size:15px;">₹${grandTotalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div class="grand-summary">
          <h2>Settlement Summary</h2>
          ${settlementHTML}
        </div>

        <div class="footer">
          Generated by FuelTrack &bull; ${new Date().toLocaleString('en-IN')}
        </div>
      </body>
      </html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Sales & Settlement</h1>
        <div className="flex items-center gap-3">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-48" />
          {shifts.length > 0 && (
            <button onClick={handlePrint} className="btn-secondary flex items-center gap-2">
              <Download size={16} /> Download PDF
            </button>
          )}
        </div>
      </div>

      {shifts.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-zinc-400 mb-4">No shifts for this date</p>
          <div className="flex gap-3 justify-center">
            {!hasShift1 && <button onClick={() => createShift(1)} className="btn-primary">Create Shift 1 (6AM-2PM)</button>}
            {!hasShift2 && <button onClick={() => createShift(2)} className="btn-secondary">Create Shift 2 (2PM-10PM)</button>}
          </div>
        </div>
      )}

      {!hasShift1 && shifts.length > 0 && (
        <button onClick={() => createShift(1)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create Shift 1 (6AM-2PM)
        </button>
      )}

      {!hasShift2 && shifts.length > 0 && (
        <button onClick={() => createShift(2)} className="btn-secondary flex items-center gap-2">
          <Plus size={16} /> Create Shift 2 (2PM-10PM)
        </button>
      )}

      {shifts.map((shift) => (
        <div key={shift._id} className="card">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedShift(expandedShift === shift._id ? null : shift._id)}>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">Shift {shift.shiftNumber}</span>
              <span className="text-sm text-zinc-400">{shift.startTime} - {shift.endTime}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${shift.status === 'OPEN' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                {shift.status}
              </span>
            </div>
            {expandedShift === shift._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>

          {expandedShift === shift._id && (
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Fuel Sales</span>
                  <button onClick={() => setShowAddSale(showAddSale === shift._id ? null : shift._id)}
                    className="text-[#22C55E] text-xs flex items-center gap-1 hover:underline">
                    <Plus size={12} /> Add Sale
                  </button>
                </div>
                {shift.sales.length === 0 && <p className="text-sm text-zinc-500">No sales recorded</p>}
                {shift.sales.map((sale: any) => (
                  <div key={sale._id} className="flex items-center justify-between p-2 bg-[#27272A] rounded text-sm">
                    <div>
                      <span>{getFuelName(sale.fuelType)} - {getNozzleName(sale.nozzle)}</span>
                      <span className="text-zinc-500 text-xs ml-2">by {typeof sale.employee === 'object' ? sale.employee.name : 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400">{Number(sale.quantity).toFixed(2)}L × ₹{Number(sale.rate).toFixed(2)}</span>
                      <span className="font-bold">{formatCurrency(Number(sale.amount))}</span>
                      {shift.status === 'OPEN' && (
                        <div className="flex gap-1">
                          <button onClick={() => openEditSale(shift._id, sale)} className="text-zinc-400 hover:text-white p-1">
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => removeSale(shift._id, sale._id)} className="text-zinc-400 hover:text-red-400 p-1">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {showAddSale === shift._id && (
                <div className="p-3 bg-[#27272A] rounded-lg space-y-3">
                  <select value={saleForm.nozzleId}
                    onChange={(e) => {
                      const n = nozzles.find(n => n._id === e.target.value);
                      setSaleForm({ ...saleForm, nozzleId: e.target.value, openingReading: n?.currentMeter || 0 });
                    }} className="w-full">
                    <option value="">Select nozzle</option>
                    {nozzles.filter(n => n.isActive).map(n => (
                      <option key={n._id} value={n._id}>{n.name} ({getFuelName(n.fuelType)})</option>
                    ))}
                  </select>
                  <select value={saleForm.employeeId}
                    onChange={(e) => setSaleForm({ ...saleForm, employeeId: e.target.value })} className="w-full">
                    <option value="">Select employee at nozzle</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400">Opening Reading</label>
                      <input type="number" value={saleForm.openingReading}
                        onChange={(e) => setSaleForm({ ...saleForm, openingReading: Number(e.target.value) })} className="w-full" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Closing Reading</label>
                      <input type="number" value={saleForm.closingReading}
                        onChange={(e) => setSaleForm({ ...saleForm, closingReading: Number(e.target.value) })} className="w-full" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => addSale(shift._id)} className="btn-primary text-sm">Add Sale</button>
                    <button onClick={() => setShowAddSale(null)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </div>
              )}

              {editingSale?.shiftId === shift._id && (
                <div className="p-3 bg-[#27272A] rounded-lg space-y-3 border border-[#22C55E]/30">
                  <p className="text-xs text-[#22C55E] font-medium">Edit Sale</p>
                  <select value={saleForm.nozzleId}
                    onChange={(e) => {
                      const n = nozzles.find(n => n._id === e.target.value);
                      setSaleForm({ ...saleForm, nozzleId: e.target.value, openingReading: n?.currentMeter || 0 });
                    }} className="w-full">
                    <option value="">Select nozzle</option>
                    {nozzles.filter(n => n.isActive).map(n => (
                      <option key={n._id} value={n._id}>{n.name} ({getFuelName(n.fuelType)})</option>
                    ))}
                  </select>
                  <select value={saleForm.employeeId}
                    onChange={(e) => setSaleForm({ ...saleForm, employeeId: e.target.value })} className="w-full">
                    <option value="">Select employee at nozzle</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400">Opening Reading</label>
                      <input type="number" value={saleForm.openingReading}
                        onChange={(e) => setSaleForm({ ...saleForm, openingReading: Number(e.target.value) })} className="w-full" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400">Closing Reading</label>
                      <input type="number" value={saleForm.closingReading}
                        onChange={(e) => setSaleForm({ ...saleForm, closingReading: Number(e.target.value) })} className="w-full" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={editSale} className="btn-primary text-sm">Update Sale</button>
                    <button onClick={() => { setEditingSale(null); setSaleForm({ nozzleId: '', employeeId: '', openingReading: 0, closingReading: 0 }); }} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </div>
              )}

              <div className="border-t border-[#27272A] pt-4">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Adjustments</h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-zinc-400">Testing (₹)</label>
                    <input type="number" value={getLocal(shift._id, 'testingAmount', shift.testingAmount)}
                      onChange={(e) => setLocal(shift._id, 'testingAmount', e.target.value)}
                      onBlur={() => saveLocal(shift._id, 'testingAmount')}
                      className="w-full mt-1" min="0" disabled={shift.status === 'FINALIZED'} />
                  </div>
                  <div>
                    <label className="text-zinc-400">Tiffin (₹)</label>
                    <input type="number" value={getLocal(shift._id, 'tiffinAmount', shift.tiffinAmount)}
                      onChange={(e) => setLocal(shift._id, 'tiffinAmount', e.target.value)}
                      onBlur={() => saveLocal(shift._id, 'tiffinAmount')}
                      className="w-full mt-1" min="0" disabled={shift.status === 'FINALIZED'} />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-zinc-400">Miscellaneous Expenses</span>
                    {shift.status === 'OPEN' && (
                      <button onClick={() => setShowAddExpense(showAddExpense === shift._id ? null : shift._id)}
                        className="text-[#22C55E] text-xs flex items-center gap-1 hover:underline">
                        <Plus size={12} /> Add Expense
                      </button>
                    )}
                  </div>
                  {shift.miscExpenses.map((exp: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-[#27272A] rounded text-sm mb-1">
                      <span>{exp.purpose}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400">-{formatCurrency(exp.amount)}</span>
                        {shift.status === 'OPEN' && (
                          <button onClick={() => removeExpense(shift._id, i)} className="text-zinc-400 hover:text-red-400">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {showAddExpense === shift._id && (
                    <div className="p-3 bg-[#27272A] rounded-lg space-y-2 mt-2">
                      <input type="text" value={expenseForm.purpose}
                        onChange={(e) => setExpenseForm({ ...expenseForm, purpose: e.target.value })}
                        placeholder="Purpose (e.g. Tea)" className="w-full" />
                      <input type="number" value={expenseForm.amount || ''}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) || 0 })}
                        placeholder="Amount" className="w-full" min="0" />
                      <div className="flex gap-2">
                        <button onClick={() => addExpense(shift._id)} className="btn-primary text-sm">Add</button>
                        <button onClick={() => setShowAddExpense(null)} className="btn-secondary text-sm">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-zinc-400">Other Adjustments</span>
                    {shift.status === 'OPEN' && (
                      <div className="flex gap-2">
                        <button onClick={() => setShowAddAdjustment({ shiftId: shift._id, type: 'ADD' })}
                          className="text-[#22C55E] text-xs flex items-center gap-1 hover:underline">
                          <Plus size={12} /> Add
                        </button>
                        <button onClick={() => setShowAddAdjustment({ shiftId: shift._id, type: 'SUBTRACT' })}
                          className="text-red-400 text-xs flex items-center gap-1 hover:underline">
                          <X size={12} /> Subtract
                        </button>
                      </div>
                    )}
                  </div>
                  {shift.adjustments.map((adj: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-[#27272A] rounded text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${adj.type === 'ADD' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {adj.type === 'ADD' ? '+' : '-'}
                        </span>
                        {adj.purpose}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={adj.type === 'ADD' ? 'text-[#22C55E]' : 'text-red-400'}>
                          {adj.type === 'ADD' ? '+' : '-'}{formatCurrency(adj.amount)}
                        </span>
                        {shift.status === 'OPEN' && (
                          <button onClick={() => removeAdjustment(shift._id, i)} className="text-zinc-400 hover:text-red-400">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {showAddAdjustment?.shiftId === shift._id && (
                    <div className="p-3 bg-[#27272A] rounded-lg space-y-2 mt-2">
                      <p className="text-xs text-zinc-400">
                        {showAddAdjustment.type === 'ADD' ? '+ adds to amount to submit' : '- subtracts from amount to submit'}
                      </p>
                      <input type="text" value={adjustmentForm.purpose}
                        onChange={(e) => setAdjustmentForm({ ...adjustmentForm, purpose: e.target.value })}
                        placeholder="Purpose (e.g. Amount Taken)" className="w-full" />
                      <input type="number" value={adjustmentForm.amount || ''}
                        onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: Number(e.target.value) || 0 })}
                        placeholder="Amount" className="w-full" min="0" />
                      <div className="flex gap-2">
                        <button onClick={() => addAdjustment(shift._id)} className="btn-primary text-sm">Add</button>
                        <button onClick={() => setShowAddAdjustment(null)} className="btn-secondary text-sm">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-[#27272A] pt-4 bg-[#27272A] rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Sales Amount</span>
                  <span className="font-bold">{formatCurrency(shift.totalSalesAmount)}</span>
                </div>
                {shift.testingAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Testing</span>
                    <span className="text-red-400">-{formatCurrency(shift.testingAmount)}</span>
                  </div>
                )}
                {shift.tiffinAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Tiffin</span>
                    <span className="text-red-400">-{formatCurrency(shift.tiffinAmount)}</span>
                  </div>
                )}
                {shift.totalMiscExpense > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Misc Expenses</span>
                    <span className="text-red-400">-{formatCurrency(shift.totalMiscExpense)}</span>
                  </div>
                )}
                {shift.totalAddAdjustment > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Add Adjustments</span>
                    <span className="text-[#22C55E]">+{formatCurrency(shift.totalAddAdjustment)}</span>
                  </div>
                )}
                {shift.totalSubtractAdjustment > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Subtract Adjustments</span>
                    <span className="text-red-400">-{formatCurrency(shift.totalSubtractAdjustment)}</span>
                  </div>
                )}
                <div className="border-t border-[#3F3F46] pt-2 flex justify-between font-bold text-lg">
                  <span>Amount To Submit</span>
                  <span className="text-[#22C55E]">{formatCurrency(shift.amountToSubmit)}</span>
                </div>
              </div>

              <div className="border-t border-[#27272A] pt-4 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-300">Collection</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400">Cash Submitted (₹)</label>
                    <input type="number" value={getLocal(shift._id, 'cashSubmitted', shift.cashSubmitted)}
                      onChange={(e) => setLocal(shift._id, 'cashSubmitted', e.target.value)}
                      onBlur={() => saveLocal(shift._id, 'cashSubmitted')}
                      className="w-full mt-1" min="0" disabled={shift.status === 'FINALIZED'} />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400">Online Payment (₹)</label>
                    <input type="number" value={getLocal(shift._id, 'onlineSubmitted', shift.onlineSubmitted)}
                      onChange={(e) => setLocal(shift._id, 'onlineSubmitted', e.target.value)}
                      onBlur={() => saveLocal(shift._id, 'onlineSubmitted')}
                      className="w-full mt-1" min="0" disabled={shift.status === 'FINALIZED'} />
                  </div>
                </div>

                <div className="bg-[#27272A] rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Total Submitted</span>
                    <span className="font-bold">{formatCurrency(shift.totalSubmitted)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Difference</span>
                    <span className={`font-bold ${shift.difference === 0 ? 'text-[#22C55E]' : shift.difference > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      {shift.difference === 0 ? 'BALANCED' : shift.difference > 0 ? `EXTRA ${formatCurrency(shift.difference)}` : `SHORT ${formatCurrency(Math.abs(shift.difference))}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                {shift.status === 'OPEN' ? (
                  <button onClick={() => finalizeShift(shift._id)} className="btn-primary flex items-center gap-2">
                    <Lock size={14} /> Finalize Shift
                  </button>
                ) : (
                  <button onClick={() => reopenShift(shift._id)} className="btn-secondary flex items-center gap-2">
                    <Unlock size={14} /> Reopen Shift
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
