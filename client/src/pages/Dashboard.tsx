import { useState, useEffect } from 'react';
import api from '../services/api';
import { DashboardData } from '../types';
import {
  TrendingUp, DollarSign, CreditCard, Users, Fuel, Droplets,
  ArrowUpRight, ArrowDownRight, Banknote
} from 'lucide-react';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchDashboard();
  }, [selectedDate]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/dashboard', { params: { date: selectedDate } });
      setData(res.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">Failed to load dashboard</div>
      </div>
    );
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const cards = [
    { label: isToday ? "Today's Sales" : `Sales (${selectedDate})`, value: formatCurrency(data.todaySales), icon: TrendingUp, color: 'text-[#22C55E]' },
    { label: 'Total Sales', value: formatCurrency(data.totalSales), icon: Banknote, color: 'text-blue-400' },
    { label: 'Cash Collected', value: formatCurrency(data.todayCash), icon: DollarSign, color: 'text-yellow-400' },
    { label: 'Online Payment', value: formatCurrency(data.todayOnline), icon: CreditCard, color: 'text-purple-400' },
    { label: isToday ? "Today's Credit" : `Credit (${selectedDate})`, value: formatCurrency(data.todayCredit), icon: CreditCard, color: 'text-orange-400' },
    { label: 'Payments Received', value: formatCurrency(data.todayPaymentsReceived), icon: Banknote, color: 'text-teal-400' },
    { label: 'Outstanding Credit', value: formatCurrency(data.outstandingCredit), icon: CreditCard, color: 'text-red-400' },
    {
      label: 'Extra / Short',
      value: data.todayExtra > 0 ? `+${formatCurrency(data.todayExtra)}` : data.todayShort > 0 ? `-${formatCurrency(data.todayShort)}` : '₹0',
      icon: data.todayExtra > 0 ? ArrowUpRight : ArrowDownRight,
      color: data.todayExtra > 0 ? 'text-[#22C55E]' : data.todayShort > 0 ? 'text-red-400' : 'text-zinc-400'
    },
    { label: isToday ? 'Employees (Today)' : `Employees (${selectedDate})`, value: `${data.presentToday}/${data.totalEmployees}`, icon: Users, color: 'text-cyan-400' },
    { label: 'Fuel Types', value: data.totalFuelTypes.toString(), icon: Fuel, color: 'text-amber-400' },
    { label: 'Nozzles', value: data.totalNozzles.toString(), icon: Droplets, color: 'text-indigo-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-[#27272A] border border-[#3F3F46] rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="card">
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={16} className={card.color} />
              <span className="text-xs text-zinc-400">{card.label}</span>
            </div>
            <div className={`text-lg font-bold ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {data.fuelSalesBreakdown.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Fuel Sales Breakdown ({isToday ? 'Today' : selectedDate})</h2>
          <div className="space-y-3">
            {data.fuelSalesBreakdown.map((item) => (
              <div key={item.fuelType} className="flex items-center justify-between p-3 bg-[#27272A] rounded-lg">
                <div>
                  <span className="font-medium">{item.fuelType}</span>
                  <span className="text-zinc-400 text-sm ml-2">{item.quantity.toFixed(1)} L</span>
                </div>
                <span className="font-bold text-[#22C55E]">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.fuelSalesBreakdown.length === 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Fuel Sales Breakdown ({isToday ? 'Today' : selectedDate})</h2>
          <div className="text-center py-8 text-zinc-400">
            <Fuel size={32} className="mx-auto mb-2 opacity-50" />
            <p>No sales recorded today</p>
          </div>
        </div>
      )}
    </div>
  );
}
