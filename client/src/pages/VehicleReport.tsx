import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, X, Download, Car, Settings2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
  _id: string;
  date: string;
  amount: number;
}

interface Vehicle {
  _id: string;
  vehicleNumber: string;
  transactions: Transaction[];
}

interface ReportData {
  _id: string;
  pumpName: string;
  address: string;
  mobile: string;
  partyName: string;
  vehicles: Vehicle[];
}

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (d: string) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
};

export default function VehicleReport() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [partyName, setPartyName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [txnForms, setTxnForms] = useState<Record<string, { date: string; amount: string }>>({});
  const [editingParty, setEditingParty] = useState(false);
  const [partyInput, setPartyInput] = useState('');
  const [showPumpDetails, setShowPumpDetails] = useState(false);
  const [pumpForm, setPumpForm] = useState({ pumpName: '', address: '', mobile: '' });

  useEffect(() => { fetchReport(); }, []);

  const fetchReport = async () => {
    try {
      const { data } = await api.get('/vehicle-report');
      setReport(data.data);
      setPartyName(data.data.partyName || '');
      setPartyInput(data.data.partyName || '');
      setPumpForm({
        pumpName: data.data.pumpName || '',
        address: data.data.address || '',
        mobile: data.data.mobile || '',
      });
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const savePumpDetails = async () => {
    try {
      await api.put('/vehicle-report/pump-details', pumpForm);
      toast.success('Pump details saved');
      setShowPumpDetails(false);
      fetchReport();
    } catch {
      toast.error('Failed to save');
    }
  };

  const savePartyName = async () => {
    try {
      await api.put('/vehicle-report/party-name', { partyName: partyInput });
      setPartyName(partyInput);
      setEditingParty(false);
      toast.success('Party name saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const addVehicle = async () => {
    if (!vehicleNumber.trim()) { toast.error('Enter vehicle number'); return; }
    try {
      await api.post('/vehicle-report/vehicle', { vehicleNumber: vehicleNumber.trim() });
      setVehicleNumber('');
      toast.success('Vehicle added');
      fetchReport();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const removeVehicle = async (vehicleId: string) => {
    try {
      await api.delete(`/vehicle-report/vehicle/${vehicleId}`);
      toast.success('Vehicle removed');
      fetchReport();
    } catch {
      toast.error('Failed to remove');
    }
  };

  const addTransaction = async (vehicleId: string) => {
    const form = txnForms[vehicleId];
    if (!form?.date || !form?.amount || Number(form.amount) <= 0) {
      toast.error('Enter date and amount');
      return;
    }
    try {
      await api.post(`/vehicle-report/vehicle/${vehicleId}/transaction`, {
        date: form.date,
        amount: Number(form.amount),
      });
      setTxnForms((prev) => ({ ...prev, [vehicleId]: { date: '', amount: '' } }));
      toast.success('Transaction added');
      fetchReport();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const removeTransaction = async (vehicleId: string, txnId: string) => {
    try {
      await api.delete(`/vehicle-report/vehicle/${vehicleId}/transaction/${txnId}`);
      toast.success('Transaction removed');
      fetchReport();
    } catch {
      toast.error('Failed to remove');
    }
  };

  const getVehicleTotal = (v: Vehicle) =>
    v.transactions.reduce((sum, t) => sum + t.amount, 0);

  const getGrandTotal = () =>
    report?.vehicles.reduce((sum, v) => sum + getVehicleTotal(v), 0) || 0;

  const generatePDF = () => {
    if (!report) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    // --- Green Header Bar ---
    doc.setFillColor(34, 197, 94);
    doc.rect(margin, y, pageWidth - 2 * margin, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(report.pumpName || 'Vehicle Report', pageWidth / 2, y + 8, { align: 'center' });
    y += 16;

    // --- Address ---
    if (report.address) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(report.address, pageWidth / 2, y, { align: 'center' });
      y += 5;
    }

    // --- Mobile Numbers ---
    if (report.mobile) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(`MOB: ${report.mobile}`, pageWidth / 2, y, { align: 'center' });
      y += 5;
    }

    // --- Party Name + Date Range ---
    y += 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0);
    if (report.partyName) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Party Name: ${report.partyName}`, margin, y);
      doc.setFont('helvetica', 'normal');
    }
    if (dateFrom && dateTo) {
      doc.text(`Supply and Breakup for the Period: ${formatDate(dateFrom)} to ${formatDate(dateTo)}`, pageWidth / 2, y + 6, { align: 'center' });
    }
    y += 12;

    // --- Collect & sort all transactions ---
    const allTxns: { date: string; vehicleNumber: string; amount: number }[] = [];
    report.vehicles.forEach((v) => {
      v.transactions.forEach((t) => {
        allTxns.push({ date: formatDate(t.date), vehicleNumber: v.vehicleNumber, amount: t.amount });
      });
    });
    allTxns.sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber));

    if (allTxns.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text('No transactions to display.', pageWidth / 2, y + 10, { align: 'center' });
      doc.save('vehicle-report.pdf');
      return;
    }

    // --- Build rows with blank gap rows between vehicle groups ---
    const formattedRows: { date: string; vehicle: string; amount: string; isGap: boolean }[] = [];
    let prevVehicle = '';
    allTxns.forEach((txn) => {
      if (prevVehicle && txn.vehicleNumber !== prevVehicle) {
        formattedRows.push({ date: '', vehicle: '', amount: '', isGap: true });
      }
      formattedRows.push({ date: txn.date, vehicle: txn.vehicleNumber, amount: txn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), isGap: false });
      prevVehicle = txn.vehicleNumber;
    });

    // --- Split into two columns ---
    const mid = Math.ceil(formattedRows.length / 2);
    const leftData = formattedRows.slice(0, mid);
    const rightData = formattedRows.slice(mid);

    const leftTotal = leftData.filter((r) => !r.isGap).reduce((s, r) => s + parseFloat(r.amount.replace(/,/g, '') || '0'), 0);
    const rightTotal = rightData.filter((r) => !r.isGap).reduce((s, r) => s + parseFloat(r.amount.replace(/,/g, '') || '0'), 0);

    const maxRows = Math.max(leftData.length, rightData.length);
    const rowsLeft = leftData.map((r) => r.isGap ? ['', '', ''] : [r.date, r.vehicle, r.amount]);
    const rowsRight = rightData.map((r) => r.isGap ? ['', '', ''] : [r.date, r.vehicle, r.amount]);
    while (rowsLeft.length < maxRows) rowsLeft.push(['', '', '']);
    while (rowsRight.length < maxRows) rowsRight.push(['', '', '']);

    const halfW = (pageWidth - 2 * margin - 4) / 2;
    const header = [['Date', 'Vehicle No.', 'Amount']];

    // --- Draw left table ---
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: pageWidth / 2 + 2 },
      head: header,
      body: rowsLeft,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 2 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30], cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: halfW * 0.28 },
        1: { cellWidth: halfW * 0.42 },
        2: { cellWidth: halfW * 0.30, halign: 'right' },
      },
      tableWidth: halfW,
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.raw[0] === '') {
          data.cell.styles.minCellHeight = 4;
          data.cell.styles.cellPadding = { top: 0, bottom: 0, left: 1.5, right: 1.5 };
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.lineWidth = 0;
          data.cell.styles.lineColor = [255, 255, 255];
        }
      },
    });

    // --- Draw right table ---
    autoTable(doc, {
      startY: y,
      margin: { left: pageWidth / 2 + 2, right: margin },
      head: header,
      body: rowsRight,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 2 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30], cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: halfW * 0.28 },
        1: { cellWidth: halfW * 0.42 },
        2: { cellWidth: halfW * 0.30, halign: 'right' },
      },
      tableWidth: halfW,
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.raw[0] === '') {
          data.cell.styles.minCellHeight = 4;
          data.cell.styles.cellPadding = { top: 0, bottom: 0, left: 1.5, right: 1.5 };
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.lineWidth = 0;
          data.cell.styles.lineColor = [255, 255, 255];
        }
      },
    });

    const tableEndY = Math.max(
      (doc as any).lastAutoTable?.finalY || y,
      y + maxRows * 7
    );
    y = tableEndY + 4;

    // --- Totals row ---
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(`Total: ${leftTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + 2, y);
    doc.text(`Total: ${rightTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth / 2 + 4, y);
    y += 8;

    // --- Grand Total ---
    doc.setFillColor(34, 197, 94);
    doc.rect(margin, y - 4, pageWidth - 2 * margin, 9, 'F');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`GRAND TOTAL = ${getGrandTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth / 2, y + 2, { align: 'center' });

    doc.save('vehicle-report.pdf');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-zinc-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Vehicle Report</h1>
        <button onClick={generatePDF} className="btn-primary flex items-center gap-2">
          <Download size={16} /> Export PDF
        </button>
      </div>

      {/* Pump Details */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-zinc-300">Pump Details</h3>
          <button onClick={() => setShowPumpDetails(!showPumpDetails)}
            className="text-xs text-[#22C55E] hover:underline flex items-center gap-1">
            <Settings2 size={14} /> {showPumpDetails ? 'Close' : 'Edit'}
          </button>
        </div>

        {!showPumpDetails ? (
          <div className="text-sm text-zinc-400 space-y-1">
            <p><span className="text-zinc-300 font-medium">Name:</span> {report?.pumpName || '—'}</p>
            <p><span className="text-zinc-300 font-medium">Address:</span> {report?.address || '—'}</p>
            <p><span className="text-zinc-300 font-medium">Mobile:</span> {report?.mobile || '—'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Pump Name</label>
                <input type="text" value={pumpForm.pumpName}
                  onChange={(e) => setPumpForm({ ...pumpForm, pumpName: e.target.value })}
                  placeholder="e.g. NILKANTHA ENERGY FILLING TERMINAL" className="w-full" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Address</label>
                <input type="text" value={pumpForm.address}
                  onChange={(e) => setPumpForm({ ...pumpForm, address: e.target.value })}
                  placeholder="e.g. Hp Petrol Pump, Sahyadripur, Salpa Road" className="w-full" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Mobile Numbers</label>
                <input type="text" value={pumpForm.mobile}
                  onChange={(e) => setPumpForm({ ...pumpForm, mobile: e.target.value })}
                  placeholder="e.g. 9009317321, 9850466135" className="w-full" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={savePumpDetails} className="btn-primary text-sm">Save Details</button>
              <button onClick={() => { setShowPumpDetails(false); setPumpForm({ pumpName: report?.pumpName || '', address: report?.address || '', mobile: report?.mobile || '' }); }}
                className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Party Name & Date Range */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Party Name</label>
            {editingParty ? (
              <div className="flex gap-2">
                <input type="text" value={partyInput} onChange={(e) => setPartyInput(e.target.value)}
                  placeholder="Enter party name" className="flex-1" />
                <button onClick={savePartyName} className="btn-primary text-sm px-3">Save</button>
                <button onClick={() => { setEditingParty(false); setPartyInput(partyName); }}
                  className="btn-secondary text-sm px-3">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setEditingParty(true)}
                className="text-sm text-zinc-300 hover:text-white transition-colors text-left w-full">
                {partyName || 'Click to set party name...'}
              </button>
            )}
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Date To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full" />
          </div>
        </div>
      </div>

      {/* Add Vehicle */}
      <div className="card">
        <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Car size={18} className="text-zinc-400" />
            <input type="text" value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && addVehicle()}
              placeholder="Enter vehicle number (e.g. MH12AB1234)"
              className="flex-1" />
          </div>
          <button onClick={addVehicle} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="space-y-4">
        {report?.vehicles.map((vehicle) => {
          const total = getVehicleTotal(vehicle);
          const form = txnForms[vehicle._id] || { date: '', amount: '' };
          return (
            <div key={vehicle._id} className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Car size={18} className="text-[#22C55E]" />
                  {vehicle.vehicleNumber}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400">
                    {vehicle.transactions.length} transaction{vehicle.transactions.length !== 1 ? 's' : ''}
                  </span>
                  <span className="font-bold text-[#22C55E]">{formatCurrency(total)}</span>
                  <button onClick={() => removeVehicle(vehicle._id)}
                    className="text-zinc-400 hover:text-red-400 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {vehicle.transactions.length > 0 && (
                <div className="mb-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#27272A]">
                        <th className="text-left py-2 px-3 text-xs text-zinc-400 font-medium">Date</th>
                        <th className="text-right py-2 px-3 text-xs text-zinc-400 font-medium">Amount</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicle.transactions.map((txn) => (
                        <tr key={txn._id} className="border-b border-[#27272A]/50">
                          <td className="py-2 px-3">{formatDate(txn.date)}</td>
                          <td className="py-2 px-3 text-right font-medium">{formatCurrency(txn.amount)}</td>
                          <td className="py-2 px-3 text-right">
                            <button onClick={() => removeTransaction(vehicle._id, txn._id)}
                              className="text-zinc-500 hover:text-red-400 transition-colors">
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-[#27272A]">
                        <td className="py-2 px-3 font-semibold text-xs text-zinc-400">Subtotal</td>
                        <td className="py-2 px-3 text-right font-bold">{formatCurrency(total)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-zinc-400 mb-1 block">Date</label>
                  <input type="date" value={form.date}
                    onChange={(e) => setTxnForms((prev) => ({
                      ...prev, [vehicle._id]: { ...prev[vehicle._id], date: e.target.value }
                    }))}
                    className="w-full" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-zinc-400 mb-1 block">Amount (₹)</label>
                  <input type="number" value={form.amount}
                    onChange={(e) => setTxnForms((prev) => ({
                      ...prev, [vehicle._id]: { ...prev[vehicle._id], amount: e.target.value }
                    }))}
                    onKeyDown={(e) => e.key === 'Enter' && addTransaction(vehicle._id)}
                    placeholder="0.00" min="0" step="0.01" className="w-full" />
                </div>
                <button onClick={() => addTransaction(vehicle._id)}
                  className="btn-primary flex items-center gap-1 px-3">
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          );
        })}

        {report?.vehicles.length === 0 && (
          <div className="card text-center py-12 text-zinc-400">
            <Car size={48} className="mx-auto mb-3 opacity-30" />
            <p>No vehicles added yet. Add a vehicle number above to get started.</p>
          </div>
        )}
      </div>

      {/* Grand Total */}
      {report && report.vehicles.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-zinc-300">Grand Total</span>
            <span className="text-2xl font-bold text-[#22C55E]">{formatCurrency(getGrandTotal())}</span>
          </div>
        </div>
      )}
    </div>
  );
}
