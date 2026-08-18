import { useState, useEffect } from 'react';
import api from '../services/api';
import { Employee, Attendance, AttendanceSummary } from '../types';
import toast from 'react-hot-toast';
import { Check, X as XIcon, Sun, Moon, Calendar } from 'lucide-react';

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'mark' | 'summary'>('mark');
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { fetchAttendance(); }, [selectedDate]);
  useEffect(() => { if (viewMode === 'summary') fetchSummary(); }, [summaryMonth, summaryYear]);

  const fetchEmployees = async () => {
    try { const { data } = await api.get('/employees'); setEmployees(data.data.filter((e: Employee) => e.isActive)); }
    catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get(`/attendance?date=${selectedDate}`);
      setAttendance(data.data);
    } catch { toast.error('Failed'); }
  };

  const fetchSummary = async () => {
    try {
      const { data } = await api.get(`/attendance/summary?month=${summaryMonth}&year=${summaryYear}`);
      setSummary(data.data);
    } catch { toast.error('Failed'); }
  };

  const getEmpAttendance = (empId: string) => attendance.find((a) => (a.employee as any)._id === empId);

  const mark = async (empId: string, status: 'present' | 'absent' | 'leave', shift?: 'shift1' | 'shift2') => {
    try {
      await api.post('/attendance/mark', {
        records: [{ employee: empId, date: selectedDate, status, shift: status === 'present' ? shift : null }],
      });
      fetchAttendance();
      toast.success('Marked');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('mark')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${viewMode === 'mark' ? 'bg-[#22C55E] text-black' : 'bg-[#27272A] text-zinc-400'}`}>
            Mark Attendance
          </button>
          <button onClick={() => setViewMode('summary')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${viewMode === 'summary' ? 'bg-[#22C55E] text-black' : 'bg-[#27272A] text-zinc-400'}`}>
            Monthly Summary
          </button>
        </div>
      </div>

      {viewMode === 'mark' && (
        <>
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-zinc-400" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-48" />
          </div>

          <div className="space-y-3">
            {employees.map((emp) => {
              const att = getEmpAttendance(emp._id);
              return (
                <div key={emp._id} className="card">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="font-semibold">{emp.name}</h3>
                      <p className="text-xs text-zinc-400">{emp.role}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => mark(emp._id, 'present', 'shift1')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          att?.status === 'present' && att?.shift === 'shift1'
                            ? 'bg-[#22C55E] text-black'
                            : 'bg-[#27272A] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Sun size={14} /> Shift 1
                      </button>
                      <button
                        onClick={() => mark(emp._id, 'present', 'shift2')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          att?.status === 'present' && att?.shift === 'shift2'
                            ? 'bg-[#22C55E] text-black'
                            : 'bg-[#27272A] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Moon size={14} /> Shift 2
                      </button>
                      <button
                        onClick={() => mark(emp._id, 'absent')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          att?.status === 'absent'
                            ? 'bg-red-500 text-white'
                            : 'bg-[#27272A] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <XIcon size={14} /> Absent
                      </button>
                      <button
                        onClick={() => mark(emp._id, 'leave')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          att?.status === 'leave'
                            ? 'bg-yellow-500 text-black'
                            : 'bg-[#27272A] text-zinc-400 hover:text-white'
                        }`}
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {viewMode === 'summary' && (
        <>
          <div className="flex items-center gap-3">
            <select value={summaryMonth} onChange={(e) => setSummaryMonth(Number(e.target.value))} className="w-36">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
              ))}
            </select>
            <select value={summaryYear} onChange={(e) => setSummaryYear(Number(e.target.value))} className="w-24">
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#27272A]">
                  <th className="text-left py-2 text-zinc-400 font-medium">Employee</th>
                  <th className="text-center py-2 text-zinc-400 font-medium">Present</th>
                  <th className="text-center py-2 text-zinc-400 font-medium">Absent</th>
                  <th className="text-center py-2 text-zinc-400 font-medium">Leave</th>
                  <th className="text-center py-2 text-zinc-400 font-medium">Shift 1</th>
                  <th className="text-center py-2 text-zinc-400 font-medium">Shift 2</th>
                  <th className="text-center py-2 text-zinc-400 font-medium">Worked</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.employee._id} className="border-b border-[#27272A] last:border-0">
                    <td className="py-2">{s.employee.name}</td>
                    <td className="text-center py-2 text-[#22C55E]">{s.present}</td>
                    <td className="text-center py-2 text-red-400">{s.absent}</td>
                    <td className="text-center py-2 text-yellow-400">{s.leave}</td>
                    <td className="text-center py-2">{s.shift1}</td>
                    <td className="text-center py-2">{s.shift2}</td>
                    <td className="text-center py-2 font-bold">{s.totalWorked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
