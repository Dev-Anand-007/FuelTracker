import { Response } from 'express';
import mongoose from 'mongoose';
import Shift from '../models/Shift';
import CreditTransaction from '../models/CreditTransaction';
import CreditPayment from '../models/CreditPayment';
import Attendance from '../models/Attendance';
import { AuthRequest } from '../middleware/auth';

const getDateRange = (filter: string, startDate?: string, endDate?: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case 'today':
      return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { start: y, end: new Date(y.getTime() + 86400000 - 1) };
    }
    case 'week': {
      const start = new Date(today);
      start.setDate(start.getDate() - start.getDay());
      return { start, end: new Date(today.getTime() + 86400000 - 1) };
    }
    case 'month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(today.getTime() + 86400000 - 1) };
    case 'custom':
      return {
        start: startDate ? new Date(startDate) : today,
        end: endDate ? new Date(new Date(endDate).getTime() + 86400000 - 1) : new Date(today.getTime() + 86400000 - 1),
      };
    default:
      return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
  }
};

export const getDailySales = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filter, startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter as string, startDate as string, endDate as string);

    const shifts = await Shift.find({
      petrolPump: req.user._id,
      date: { $gte: start, $lte: end },
    }).populate({ path: 'sales', populate: { path: 'fuelType', select: 'name' } });

    const dailyMap: Record<string, any> = {};
    for (const shift of shifts) {
      const dateKey = new Date(shift.date).toISOString().split('T')[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, sales: 0, cash: 0, online: 0, extra: 0, short: 0 };
      }
      dailyMap[dateKey].sales += shift.totalSalesAmount;
      dailyMap[dateKey].cash += shift.cashSubmitted;
      dailyMap[dateKey].online += shift.onlineSubmitted;
      if (shift.difference > 0) dailyMap[dateKey].extra += shift.difference;
      if (shift.difference < 0) dailyMap[dateKey].short += Math.abs(shift.difference);
    }

    res.json({ success: true, data: Object.values(dailyMap) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getShiftSales = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filter, startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter as string, startDate as string, endDate as string);

    const shifts = await Shift.find({
      petrolPump: req.user._id,
      date: { $gte: start, $lte: end },
    })
      .populate({ path: 'sales', populate: [{ path: 'fuelType', select: 'name' }, { path: 'nozzle', select: 'name' }] })
      .sort({ date: -1, shiftNumber: 1 });

    res.json({ success: true, data: shifts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCollectionReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filter, startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter as string, startDate as string, endDate as string);

    const shifts = await Shift.find({
      petrolPump: req.user._id,
      date: { $gte: start, $lte: end },
    });

    let totalCash = 0;
    let totalOnline = 0;
    let totalSubmitted = 0;
    for (const shift of shifts) {
      totalCash += shift.cashSubmitted;
      totalOnline += shift.onlineSubmitted;
      totalSubmitted += shift.totalSubmitted;
    }

    res.json({
      success: true,
      data: {
        totalCash,
        totalOnline,
        totalSubmitted,
        shiftCount: shifts.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCreditReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filter, startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter as string, startDate as string, endDate as string);

    const transactions = await CreditTransaction.find({
      petrolPump: req.user._id,
      date: { $gte: start, $lte: end },
    })
      .populate('fuelType', 'name')
      .populate('customer', 'name phone');

    const totalCredit = transactions.reduce((sum: number, t: any) => sum + t.totalAmount, 0);
    const totalPaid = transactions.reduce((sum: number, t: any) => sum + t.paidAmount, 0);

    res.json({ success: true, data: { transactions, totalCredit, totalPaid } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filter, startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter as string, startDate as string, endDate as string);

    const payments = await CreditPayment.find({
      petrolPump: req.user._id,
      date: { $gte: start, $lte: end },
    })
      .populate('customer', 'name phone')
      .populate('creditTransaction');

    const totalPayments = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

    res.json({ success: true, data: { payments, totalPayments } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filter, startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter as string, startDate as string, endDate as string);

    const attendance = await Attendance.find({
      petrolPump: req.user._id,
      date: { $gte: start, $lte: end },
    }).populate('employee', 'name phone role');

    const totalPresent = attendance.filter((a: any) => a.status === 'present').length;
    const totalAbsent = attendance.filter((a: any) => a.status === 'absent').length;
    const totalLeave = attendance.filter((a: any) => a.status === 'leave').length;

    res.json({ success: true, data: { attendance, totalPresent, totalAbsent, totalLeave } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExtraShortReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filter, startDate, endDate } = req.query;
    const { start, end } = getDateRange(filter as string, startDate as string, endDate as string);

    const shifts = await Shift.find({
      petrolPump: req.user._id,
      date: { $gte: start, $lte: end },
    });

    let totalExtra = 0;
    let totalShort = 0;
    const details: any[] = [];

    for (const shift of shifts) {
      if (shift.difference !== 0) {
        const entry = {
          date: shift.date,
          shiftNumber: shift.shiftNumber,
          amountToSubmit: shift.amountToSubmit,
          totalSubmitted: shift.totalSubmitted,
          difference: shift.difference,
          status: shift.difference > 0 ? 'EXTRA' : 'SHORT',
        };
        details.push(entry);
        if (shift.difference > 0) totalExtra += shift.difference;
        if (shift.difference < 0) totalShort += Math.abs(shift.difference);
      }
    }

    res.json({ success: true, data: { totalExtra, totalShort, details } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
