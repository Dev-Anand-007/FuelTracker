import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Calendar, FileText } from 'lucide-react';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

type ReportType = 'daily-sales' | 'shift-sales' | 'collection' | 'credit' | 'payments' | 'attendance' | 'extra-short';

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>('daily-sales');
  const [filter, setFilter] = useState('today');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reportTypes: { value: ReportType; label: string }[] = [
    { value: 'daily-sales', label: 'Daily Sales' },
    { value: 'shift-sales', label: 'Shift Sales' },
    { value: 'collection', label: 'Cash/Online Collection' },
    { value: 'credit', label: 'Credit Sales' },
    { value: 'payments', label: 'Payments' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'extra-short', label: 'Extra/Short' },
  ];

  useEffect(() => { fetchReport(); }, [reportType, filter, startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/reports/${reportType}?filter=${filter}`;
      if (filter === 'custom') url += `&startDate=${startDate}&endDate=${endDate}`;
      const { data: res } = await api.get(url);
      setData(res.data);
    } catch { toast.error('Failed to load report'); setData(null); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="flex flex-wrap gap-2">
        {reportTypes.map((rt) => (
          <button key={rt.value} onClick={() => setReportType(rt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${reportType === rt.value ? 'bg-[#22C55E] text-black' : 'bg-[#27272A] text-zinc-400 hover:text-white'}`}>
            {rt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {['today', 'yesterday', 'week', 'month', 'custom'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium ${filter === f ? 'bg-[#22C55E] text-black' : 'bg-[#27272A] text-zinc-400'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {filter === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
            <span className="text-zinc-400">to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="card text-center py-8 text-zinc-400">Loading...</div>
      ) : !data ? (
        <div className="card text-center py-8 text-zinc-400">No data</div>
      ) : (
        <div className="card">
          {reportType === 'daily-sales' && (
            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Daily Sales Report</h3>
              {data.length === 0 && <p className="text-zinc-400 text-sm">No sales data</p>}
              {data.map((d: any) => (
                <div key={d.date} className="flex items-center justify-between p-3 bg-[#27272A] rounded">
                  <span className="text-sm">{new Date(d.date).toLocaleDateString('en-IN')}</span>
                  <div className="flex gap-4 text-sm">
                    <span className="font-bold">{formatCurrency(d.sales)}</span>
                    <span className="text-zinc-400">Cash: {formatCurrency(d.cash)}</span>
                    <span className="text-zinc-400">Online: {formatCurrency(d.online)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {reportType === 'shift-sales' && (
            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Shift Sales Report</h3>
              {data.length === 0 && <p className="text-zinc-400 text-sm">No shift data</p>}
              {data.map((s: any) => (
                <div key={s._id} className="p-3 bg-[#27272A] rounded">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Shift {s.shiftNumber} • {new Date(s.date).toLocaleDateString('en-IN')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${s.status === 'FINALIZED' ? 'bg-zinc-500/20 text-zinc-400' : 'bg-green-500/20 text-green-400'}`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="text-sm mt-1">
                    <span className="text-zinc-400">Sales: {formatCurrency(s.totalSalesAmount)}</span>
                    <span className="text-zinc-400 ml-3">Submitted: {formatCurrency(s.totalSubmitted)}</span>
                    <span className={`ml-3 ${s.difference === 0 ? 'text-[#22C55E]' : s.difference > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      {s.difference === 0 ? 'BALANCED' : s.difference > 0 ? `+${formatCurrency(s.difference)}` : `-${formatCurrency(Math.abs(s.difference))}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {reportType === 'collection' && (
            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Collection Report</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[#27272A] rounded text-center">
                  <p className="text-xs text-zinc-400 mb-1">Total Cash</p>
                  <p className="text-lg font-bold text-yellow-400">{formatCurrency(data.totalCash)}</p>
                </div>
                <div className="p-4 bg-[#27272A] rounded text-center">
                  <p className="text-xs text-zinc-400 mb-1">Total Online</p>
                  <p className="text-lg font-bold text-purple-400">{formatCurrency(data.totalOnline)}</p>
                </div>
                <div className="p-4 bg-[#27272A] rounded text-center">
                  <p className="text-xs text-zinc-400 mb-1">Total Submitted</p>
                  <p className="text-lg font-bold text-[#22C55E]">{formatCurrency(data.totalSubmitted)}</p>
                </div>
              </div>
            </div>
          )}

          {reportType === 'credit' && (
            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Credit Sales Report</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-[#27272A] rounded text-center">
                  <p className="text-xs text-zinc-400 mb-1">Total Credit</p>
                  <p className="text-lg font-bold text-orange-400">{formatCurrency(data.totalCredit)}</p>
                </div>
                <div className="p-4 bg-[#27272A] rounded text-center">
                  <p className="text-xs text-zinc-400 mb-1">Total Paid</p>
                  <p className="text-lg font-bold text-[#22C55E]">{formatCurrency(data.totalPaid)}</p>
                </div>
              </div>
              {data.transactions.map((t: any) => (
                <div key={t._id} className="flex items-center justify-between p-3 bg-[#27272A] rounded text-sm">
                  <span>{t.customer?.name || 'Unknown'} • {t.fuelType?.name}</span>
                  <span className="font-bold">{formatCurrency(t.totalAmount)}</span>
                </div>
              ))}
            </div>
          )}

          {reportType === 'payments' && (
            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Payment Report</h3>
              <p className="text-sm text-zinc-400">Total: <span className="font-bold text-[#22C55E]">{formatCurrency(data.totalPayments)}</span></p>
              {data.payments.map((p: any) => (
                <div key={p._id} className="flex items-center justify-between p-3 bg-[#27272A] rounded text-sm">
                  <span>{p.customer?.name} • {p.paymentMethod}</span>
                  <span className="font-bold">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {reportType === 'attendance' && (
            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Attendance Report</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-[#27272A] rounded text-center">
                  <p className="text-xs text-zinc-400 mb-1">Present</p>
                  <p className="text-lg font-bold text-[#22C55E]">{data.totalPresent}</p>
                </div>
                <div className="p-4 bg-[#27272A] rounded text-center">
                  <p className="text-xs text-zinc-400 mb-1">Absent</p>
                  <p className="text-lg font-bold text-red-400">{data.totalAbsent}</p>
                </div>
                <div className="p-4 bg-[#27272A] rounded text-center">
                  <p className="text-xs text-zinc-400 mb-1">Leave</p>
                  <p className="text-lg font-bold text-yellow-400">{data.totalLeave}</p>
                </div>
              </div>
            </div>
          )}

          {reportType === 'extra-short' && (
            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Extra/Short Report</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-[#27272A] rounded text-center">
                  <p className="text-xs text-zinc-400 mb-1">Total Extra</p>
                  <p className="text-lg font-bold text-[#22C55E]">{formatCurrency(data.totalExtra)}</p>
                </div>
                <div className="p-4 bg-[#27272A] rounded text-center">
                  <p className="text-xs text-zinc-400 mb-1">Total Short</p>
                  <p className="text-lg font-bold text-red-400">{formatCurrency(data.totalShort)}</p>
                </div>
              </div>
              {data.details.map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-[#27272A] rounded text-sm">
                  <span>Shift {d.shiftNumber} • {new Date(d.date).toLocaleDateString('en-IN')}</span>
                  <span className={d.status === 'EXTRA' ? 'text-[#22C55E] font-bold' : 'text-red-400 font-bold'}>
                    {d.status}: {formatCurrency(Math.abs(d.difference))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
