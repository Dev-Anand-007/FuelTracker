import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import { Calendar, Download, Plus, Pencil, Trash2, X } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Expense = {
  _id: string;
  date: string | Date;
  amount: number;
  description?: string;
};

type ExpenseForm = {
  date: string;
  amount: string;
  description: string;
};

const emptyExpense: ExpenseForm = { date: "", amount: "", description: "" };

const formatCurrency = (value: number) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Format a date as YYYY-MM-DD using UTC date values (avoids timezone date shifts).
const toDateInputValue = (value: string | Date | null | undefined) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const formatDateForReport = (value: Date | string | null | undefined) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getUTCFullYear()}`;
};

export default function MonthlyExpense() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newExpense, setNewExpense] = useState<ExpenseForm>(emptyExpense);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchExpenses = useCallback(async (from: string, to: string) => {
    if (!from || !to) return;

    setLoading(true);
    setError("");
    try {
      const response = await api.get("/expenses", {
        params: { startDate: from, endDate: to },
      });
      const records = response.data?.data;
      setExpenses(Array.isArray(records) ? records : []);
    } catch (err: any) {
      console.error("Failed to fetch expenses:", err);
      setError(err.response?.data?.message || "Could not load expenses. Please check your connection and try again.");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize the current month once. Fetching happens in the date effect below.
  useEffect(() => {
    const now = new Date();
    // Use UTC to avoid timezone shifts when formatting for date inputs
    const firstDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
    setDateFrom(toDateInputValue(firstDay));
    setDateTo(toDateInputValue(lastDay));
  }, []);

  useEffect(() => {
    if (!dateFrom || !dateTo) return;
    if (dateFrom > dateTo) {
      setLoading(false);
      setError("The start date cannot be after the end date.");
      return;
    }
    void fetchExpenses(dateFrom, dateTo);
  }, [dateFrom, dateTo, fetchExpenses]);

  const openAddModal = () => {
    setEditingExpense(null);
    const now = new Date();
    // Use UTC date for consistent date input value
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    setNewExpense({ ...emptyExpense, date: toDateInputValue(todayUTC) });
    setShowAdd(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowAdd(false);
    setEditingExpense(null);
    setNewExpense(emptyExpense);
  };

  const handleAdd = async () => {
    if (!newExpense.date || !newExpense.amount || Number(newExpense.amount) <= 0) {
      alert("Please enter a date and an amount greater than zero.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/expenses", {
        date: newExpense.date,
        amount: Number(newExpense.amount),
        description: newExpense.description.trim(),
      });
      setShowAdd(false);
      setNewExpense(emptyExpense);
      await fetchExpenses(dateFrom, dateTo);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add expense.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this expense? This action cannot be undone.")) return;
    try {
      await api.delete(`/expenses/${id}`);
      await fetchExpenses(dateFrom, dateTo);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete expense.");
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      date: toDateInputValue(expense.date),
      amount: String(expense.amount ?? ""),
      description: expense.description || "",
    });
    setShowAdd(true);
  };

  const handleSaveEdit = async () => {
    if (!editingExpense?._id || !newExpense.date || !newExpense.amount || Number(newExpense.amount) <= 0) {
      alert("Please enter a date and an amount greater than zero.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/expenses/${editingExpense._id}`, {
        date: newExpense.date,
        amount: Number(newExpense.amount),
        description: newExpense.description.trim(),
      });
      setShowAdd(false);
      setEditingExpense(null);
      setNewExpense(emptyExpense);
      await fetchExpenses(dateFrom, dateTo);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update expense.");
    } finally {
      setSaving(false);
    }
  };

  const generatePDF = () => {
    if (expenses.length === 0) {
      alert("No expenses to export for this period.");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    doc.setFillColor(34, 197, 94);
    doc.rect(margin, y, pageWidth - 2 * margin, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(0, 0, 0);
    doc.text("Monthly Expenses Report", pageWidth / 2, y + 8, { align: "center" });
    y += 19;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const period = `Period: ${formatDateForReport(dateFrom)} to ${formatDateForReport(dateTo)}`;
    doc.text(period, pageWidth / 2, y, { align: "center" });
    y += 8;

    const rows = expenses.map((expense) => [
      formatDateForReport(expense.date),
      formatCurrency(Number(expense.amount)),
      expense.description || "—",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Date", "Amount (Rs)", "Description"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [34, 197, 94], textColor: 0, fontStyle: "bold" },
      bodyStyles: { fontSize: 9, textColor: 0 },
      columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 48, halign: "right" }, 2: { cellWidth: "auto" } },
      margin: { left: margin, right: margin },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? y;
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    let totalY = finalY + 10;
    if (totalY > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      totalY = margin;
    }
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, totalY - 4, pageWidth - margin, totalY - 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Total Expenses: ${formatCurrency(total)}`, margin, totalY + 2);

    doc.save(`monthly-expenses-${dateFrom || "report"}.pdf`);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Monthly Expenses</h1>
        <button
          type="button"
          onClick={openAddModal}
          className="btn-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2 sm:w-auto"
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Date range filters */}
      <section className="card min-w-0">
        <div className="p-3 sm:p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-300">
            <Calendar size={16} className="text-zinc-400" /> Filter by date
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <label className="min-w-0 text-xs text-zinc-400">
              From
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
                className="mt-1 w-full min-w-0 rounded border border-zinc-600 bg-transparent p-2 text-sm text-inherit"
              />
            </label>
            <span className="hidden text-zinc-500 sm:block">to</span>
            <label className="min-w-0 text-xs text-zinc-400">
              To
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
                className="mt-1 w-full min-w-0 rounded border border-zinc-600 bg-transparent p-2 text-sm text-inherit"
              />
            </label>
          </div>
        </div>
      </section>

      {/* Expense results */}
      <section className="card min-w-0">
        <div className="p-3 sm:p-4">
          {loading ? (
            <div className="flex min-h-32 items-center justify-center text-sm text-zinc-400" role="status">
              Loading expenses...
            </div>
          ) : error ? (
            <div className="space-y-3 py-4 text-sm">
              <p className="text-red-400">{error}</p>
              <button type="button" onClick={() => void fetchExpenses(dateFrom, dateTo)} className="btn-secondary px-4 py-2">
                Try again
              </button>
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-zinc-400">No expenses for this period.</p>
              <button type="button" onClick={openAddModal} className="btn-primary mt-4 inline-flex items-center justify-center gap-2 px-4 py-2">
                <Plus size={16} /> Add First Expense
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 border-b border-zinc-700/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Total Expenses</p>
                  <p className="mt-1 text-2xl font-bold text-[#22C55E]">{formatCurrency(totalExpenses)}</p>
                  <p className="mt-1 text-xs text-zinc-500">{expenses.length} {expenses.length === 1 ? "record" : "records"}</p>
                </div>
                <button type="button" onClick={generatePDF} className="btn-secondary inline-flex w-full items-center justify-center gap-2 px-3 py-2 sm:w-auto">
                  <Download size={16} /> Export PDF
                </button>
              </div>

              {/* Mobile: readable expense cards */}
              <div className="space-y-3 md:hidden">
                {expenses.map((expense) => (
                  <article key={expense._id} className="rounded-lg border border-zinc-700 bg-zinc-900/30 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-400">{formatDisplayDate(expense.date)}</p>
                        <p className="mt-1 break-words text-sm text-zinc-200">{expense.description?.trim() || "No description"}</p>
                      </div>
                      <p className="shrink-0 text-right font-semibold">{formatCurrency(Number(expense.amount))}</p>
                    </div>
                    <div className="mt-3 flex justify-end gap-2 border-t border-zinc-700/70 pt-2">
                      <button type="button" onClick={() => handleEdit(expense)} className="inline-flex min-h-9 items-center gap-1 rounded px-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white" aria-label="Edit expense">
                        <Pencil size={14} /> Edit
                      </button>
                      <button type="button" onClick={() => void handleDelete(expense._id)} className="inline-flex min-h-9 items-center gap-1 rounded px-3 text-sm text-red-400 hover:bg-zinc-800" aria-label="Delete expense">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Tablet/desktop: table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-[#27272A]">
                      <th className="px-3 py-3 text-left text-xs font-medium text-zinc-400">Date</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-zinc-400">Amount</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-zinc-400">Description</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-zinc-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense._id} className="border-b border-[#27272A]/50 last:border-0">
                        <td className="px-3 py-3 whitespace-nowrap">{formatDisplayDate(expense.date)}</td>
                        <td className="px-3 py-3 text-right font-medium whitespace-nowrap">{formatCurrency(Number(expense.amount))}</td>
                        <td className="px-3 py-3 break-words text-xs text-zinc-400">{expense.description || "—"}</td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => handleEdit(expense)} className="rounded p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white" title="Edit expense" aria-label="Edit expense">
                              <Pencil size={15} />
                            </button>
                            <button type="button" onClick={() => void handleDelete(expense._id)} className="rounded p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400" title="Delete expense" aria-label="Delete expense">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Add/edit modal is outside the loading/empty/list conditional so it always opens */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-zinc-700 bg-[#27272A] p-4 shadow-xl sm:max-w-md sm:rounded-xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#22C55E]">{editingExpense ? "Edit Expense" : "Add Expense"}</h2>
              <button type="button" onClick={closeModal} disabled={saving} className="rounded p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-50" aria-label="Close dialog">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (editingExpense) void handleSaveEdit();
                else void handleAdd();
              }}
              className="space-y-4"
            >
              <label className="block text-sm text-zinc-300">
                Date <span className="text-red-400">*</span>
                <input
                  type="date"
                  required
                  value={newExpense.date}
                  onChange={(event) => setNewExpense((current) => ({ ...current, date: event.target.value }))}
                  className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-[#22C55E]"
                />
              </label>

              <label className="block text-sm text-zinc-300">
                Amount (Rs) <span className="text-red-400">*</span>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={newExpense.amount}
                  onChange={(event) => setNewExpense((current) => ({ ...current, amount: event.target.value }))}
                  placeholder="Enter amount"
                  className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-[#22C55E]"
                />
              </label>

              <label className="block text-sm text-zinc-300">
                Description <span className="text-xs text-zinc-500">(optional)</span>
                <input
                  type="text"
                  maxLength={250}
                  value={newExpense.description}
                  onChange={(event) => setNewExpense((current) => ({ ...current, description: event.target.value }))}
                  placeholder="What was this expense for?"
                  className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 p-3 text-sm text-white outline-none focus:border-[#22C55E]"
                />
              </label>

              <div className="flex flex-col-reverse gap-2 border-t border-zinc-700 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} disabled={saving} className="btn-secondary min-h-11 px-4 py-2 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? "Saving..." : editingExpense ? "Save Changes" : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
