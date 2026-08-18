import { useState, useEffect } from 'react';
import api from '../services/api';
import { CreditCustomer, CreditTransaction, CreditPayment, FuelType } from '../types';
import toast from 'react-hot-toast';
import { Plus, X, CreditCard, ChevronDown, ChevronUp, History } from 'lucide-react';

const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function CreditPage() {
  const [customers, setCustomers] = useState<CreditCustomer[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'customers' | 'transactions'>('customers');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddTxn, setShowAddTxn] = useState(false);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [expandedTxn, setExpandedTxn] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Record<string, CreditPayment[]>>({});

  const [custForm, setCustForm] = useState({ name: '', phone: '', address: '' });
  const [txnForm, setTxnForm] = useState({ customerId: '', fuelTypeId: '', quantity: 0, rate: 0, date: new Date().toISOString().split('T')[0] });
  const [payForm, setPayForm] = useState({ amount: 0, date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash' as 'Cash' | 'Online', note: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [cRes, tRes, fRes] = await Promise.all([
        api.get('/credit/customers'),
        api.get('/credit/transactions'),
        api.get('/fuel-types'),
      ]);
      setCustomers(cRes.data.data);
      setTransactions(tRes.data.data);
      setFuelTypes(fRes.data.data);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  const addCustomer = async () => {
    if (!custForm.name || !custForm.phone) { toast.error('Name and phone required'); return; }
    try {
      await api.post('/credit/customers', custForm);
      toast.success('Customer added');
      setShowAddCustomer(false);
      setCustForm({ name: '', phone: '', address: '' });
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const addTransaction = async () => {
    if (!txnForm.customerId || !txnForm.fuelTypeId || txnForm.quantity <= 0 || txnForm.rate <= 0) {
      toast.error('Fill all fields'); return;
    }
    try {
      await api.post('/credit/transactions', txnForm);
      toast.success('Credit transaction created');
      setShowAddTxn(false);
      setTxnForm({ customerId: '', fuelTypeId: '', quantity: 0, rate: 0, date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const addPayment = async (txnId: string) => {
    if (payForm.amount <= 0) { toast.error('Enter amount'); return; }
    try {
      await api.post(`/credit/transactions/${txnId}/payments`, payForm);
      toast.success('Payment recorded');
      setShowPayment(null);
      setPayForm({ amount: 0, date: new Date().toISOString().split('T')[0], paymentMethod: 'Cash', note: '' });
      fetchData();
      if (expandedTxn === txnId) loadPayments(txnId);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const loadPayments = async (txnId: string) => {
    try {
      const { data } = await api.get(`/credit/transactions/${txnId}/payments`);
      setPaymentHistory({ ...paymentHistory, [txnId]: data.data });
    } catch { toast.error('Failed to load payments'); }
  };

  const toggleTxnExpand = (txnId: string) => {
    if (expandedTxn === txnId) { setExpandedTxn(null); return; }
    setExpandedTxn(txnId);
    if (!paymentHistory[txnId]) loadPayments(txnId);
  };

  const getCustName = (c: any) => typeof c === 'object' ? c.name : customers.find(cu => cu._id === c)?.name || 'Unknown';
  const getFuelName = (f: any) => typeof f === 'object' ? f.name : fuelTypes.find(ft => ft._id === f)?.name || 'Unknown';

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Credit / Lending</h1>
        <div className="flex gap-2">
          <button onClick={() => { setView('customers'); setShowAddCustomer(true); }}
            className="btn-primary flex items-center gap-2"><Plus size={16} /> New Customer</button>
          <button onClick={() => { setView('transactions'); setShowAddTxn(true); }}
            className="btn-secondary flex items-center gap-2"><Plus size={16} /> New Credit</button>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setView('customers')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${view === 'customers' ? 'bg-[#22C55E] text-black' : 'bg-[#27272A] text-zinc-400'}`}>
          Customers
        </button>
        <button onClick={() => setView('transactions')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${view === 'transactions' ? 'bg-[#22C55E] text-black' : 'bg-[#27272A] text-zinc-400'}`}>
          Transactions
        </button>
      </div>

      {showAddCustomer && (
        <div className="card space-y-3">
          <h3 className="font-semibold">New Customer</h3>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={custForm.name} onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
              placeholder="Customer name" className="w-full" />
            <input type="tel" value={custForm.phone} onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
              placeholder="Phone" className="w-full" />
          </div>
          <input type="text" value={custForm.address} onChange={(e) => setCustForm({ ...custForm, address: e.target.value })}
            placeholder="Address (optional)" className="w-full" />
          <div className="flex gap-2">
            <button onClick={addCustomer} className="btn-primary">Save</button>
            <button onClick={() => setShowAddCustomer(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {showAddTxn && (
        <div className="card space-y-3">
          <h3 className="font-semibold">New Credit Transaction</h3>
          <div className="grid grid-cols-2 gap-3">
            <select value={txnForm.customerId} onChange={(e) => setTxnForm({ ...txnForm, customerId: e.target.value })} className="w-full">
              <option value="">Select customer</option>
              {customers.filter(c => c.isActive).map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
              ))}
            </select>
            <select value={txnForm.fuelTypeId} onChange={(e) => setTxnForm({ ...txnForm, fuelTypeId: e.target.value })} className="w-full">
              <option value="">Select fuel type</option>
              {fuelTypes.filter(f => f.isActive).map(f => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
            <div>
              <label className="text-xs text-zinc-400">Quantity (L)</label>
              <input type="number" value={txnForm.quantity || ''}
                onChange={(e) => setTxnForm({ ...txnForm, quantity: Number(e.target.value) || 0 })} className="w-full" min="0" />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Rate (₹/L)</label>
              <input type="number" value={txnForm.rate || ''}
                onChange={(e) => setTxnForm({ ...txnForm, rate: Number(e.target.value) || 0 })} className="w-full" min="0" />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Date</label>
              <input type="date" value={txnForm.date} onChange={(e) => setTxnForm({ ...txnForm, date: e.target.value })} className="w-full" />
            </div>
          </div>
          <div className="text-sm text-zinc-400">
            Total: <span className="font-bold text-[#22C55E]">{formatCurrency(txnForm.quantity * txnForm.rate)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={addTransaction} className="btn-primary">Create</button>
            <button onClick={() => setShowAddTxn(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {view === 'customers' && (
        <div className="space-y-3">
          {customers.map((c) => (
            <div key={c._id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-sm text-zinc-400">{c.phone} {c.address && `• ${c.address}`}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>Total Credit: <span className="font-bold">{formatCurrency(c.totalCredit)}</span></span>
                    <span className="text-[#22C55E]">Paid: {formatCurrency(c.totalPaid)}</span>
                    <span className="text-red-400">Remaining: {formatCurrency(c.remainingAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {customers.length === 0 && <div className="card text-center py-8 text-zinc-400">No customers yet</div>}
        </div>
      )}

      {view === 'transactions' && (
        <div className="space-y-3">
          {transactions.map((txn) => (
            <div key={txn._id} className="card">
              <div className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleTxnExpand(txn._id)}>
                <div>
                  <h3 className="font-semibold">{getCustName(txn.customer)}</h3>
                  <p className="text-sm text-zinc-400">
                    {getFuelName(txn.fuelType)} • {txn.quantity}L × ₹{txn.rate}
                  </p>
                  <div className="flex gap-3 mt-1 text-sm">
                    <span>Total: {formatCurrency(txn.totalAmount)}</span>
                    <span className="text-[#22C55E]">Paid: {formatCurrency(txn.paidAmount)}</span>
                    <span className="text-red-400">Remaining: {formatCurrency(txn.remainingAmount)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    txn.status === 'Paid' ? 'bg-[#22C55E]/20 text-[#22C55E]' :
                    txn.status === 'Partial' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{txn.status}</span>
                  {expandedTxn === txn._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {expandedTxn === txn._id && (
                <div className="mt-4 space-y-3">
                  {txn.status !== 'Paid' && (
                    <button onClick={() => { setShowPayment(txn._id); setPayForm({ ...payForm, amount: txn.remainingAmount }); }}
                      className="btn-primary text-sm flex items-center gap-1">
                      <CreditCard size={14} /> Receive Payment
                    </button>
                  )}

                  {showPayment === txn._id && (
                    <div className="p-3 bg-[#27272A] rounded-lg space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-zinc-400">Amount (₹)</label>
                          <input type="number" value={payForm.amount || ''}
                            onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) || 0 })}
                            className="w-full" min="0" max={txn.remainingAmount} />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-400">Method</label>
                          <select value={payForm.paymentMethod}
                            onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value as 'Cash' | 'Online' })}
                            className="w-full">
                            <option value="Cash">Cash</option>
                            <option value="Online">Online Payment</option>
                          </select>
                        </div>
                      </div>
                      <input type="date" value={payForm.date} onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} className="w-full" />
                      <input type="text" value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                        placeholder="Note (optional)" className="w-full" />
                      <div className="flex gap-2">
                        <button onClick={() => addPayment(txn._id)} className="btn-primary text-sm">Pay {formatCurrency(payForm.amount)}</button>
                        <button onClick={() => setShowPayment(null)} className="btn-secondary text-sm">Cancel</button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-1">
                      <History size={14} /> Payment History
                    </h4>
                    {paymentHistory[txn._id]?.length === 0 && (
                      <p className="text-sm text-zinc-500">No payments yet</p>
                    )}
                    {paymentHistory[txn._id]?.map((p) => (
                      <div key={p._id} className="flex items-center justify-between p-2 bg-[#27272A] rounded text-sm mb-1">
                        <div>
                          <span>{formatCurrency(p.amount)}</span>
                          <span className="text-zinc-400 ml-2">{p.paymentMethod}</span>
                          {p.note && <span className="text-zinc-500 ml-2">• {p.note}</span>}
                        </div>
                        <span className="text-zinc-400 text-xs">{new Date(p.date).toLocaleDateString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {transactions.length === 0 && <div className="card text-center py-8 text-zinc-400">No credit transactions yet</div>}
        </div>
      )}
    </div>
  );
}
