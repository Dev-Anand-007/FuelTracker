import { Response } from 'express';
import mongoose from 'mongoose';
import Shift from '../models/Shift';
import ShiftSale from '../models/ShiftSale';
import FuelType from '../models/FuelType';
import Nozzle from '../models/Nozzle';
import Employee from '../models/Employee';
import Attendance from '../models/Attendance';
import CreditCustomer from '../models/CreditCustomer';
import CreditTransaction from '../models/CreditTransaction';
import CreditPayment from '../models/CreditPayment';
import { AuthRequest } from '../middleware/auth';

const getStartOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pumpId = req.user._id;
    const today = getStartOfDay(new Date());
    const todayEnd = getEndOfDay(new Date());

    const todayShifts = await Shift.find({
      petrolPump: pumpId,
      date: { $gte: today, $lte: todayEnd },
    }).populate({ path: 'sales', populate: { path: 'fuelType', select: 'name' } });

    let todaySalesAmount = 0;
    let todayCash = 0;
    let todayOnline = 0;
    let todayExtra = 0;
    let todayShort = 0;
    const fuelSalesMap: Record<string, { quantity: number; amount: number }> = {};

    for (const shift of todayShifts) {
      todaySalesAmount += shift.totalSalesAmount;
      todayCash += shift.cashSubmitted;
      todayOnline += shift.onlineSubmitted;

      if (shift.difference > 0) todayExtra += shift.difference;
      if (shift.difference < 0) todayShort += Math.abs(shift.difference);

      for (const sale of shift.sales) {
        const s = sale as any;
        const ftName = s.fuelType?.name || 'Unknown';
        if (!fuelSalesMap[ftName]) fuelSalesMap[ftName] = { quantity: 0, amount: 0 };
        fuelSalesMap[ftName].quantity += s.quantity;
        fuelSalesMap[ftName].amount += s.amount;
      }
    }

    const allShifts = await Shift.find({ petrolPump: pumpId });
    let totalSalesAllTime = 0;
    for (const s of allShifts) totalSalesAllTime += s.totalSalesAmount;

    const outstandingCredit = await CreditCustomer.aggregate([
      { $match: { petrolPump: new mongoose.Types.ObjectId(pumpId), remainingAmount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$remainingAmount' } } },
    ]);

    const todayCreditTxns = await CreditTransaction.find({
      petrolPump: pumpId,
      date: { $gte: today, $lte: todayEnd },
    });

    const todayCredit = todayCreditTxns.reduce((sum: number, t: any) => sum + t.totalAmount, 0);

    const todayPayments = await CreditPayment.find({
      petrolPump: pumpId,
      date: { $gte: today, $lte: todayEnd },
    });
    const todayPaymentsReceived = todayPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

    const totalEmployees = await Employee.countDocuments({ petrolPump: pumpId, isActive: true });

    const presentToday = await Attendance.countDocuments({
      petrolPump: pumpId,
      date: { $gte: today, $lte: todayEnd },
      status: 'present',
    });

    const totalFuelTypes = await FuelType.countDocuments({ petrolPump: pumpId, isActive: true });
    const totalNozzles = await Nozzle.countDocuments({ petrolPump: pumpId, isActive: true });

    res.json({
      success: true,
      data: {
        todaySales: todaySalesAmount,
        totalSales: totalSalesAllTime,
        todayCash,
        todayOnline,
        todayCredit,
        todayPaymentsReceived,
        outstandingCredit: outstandingCredit[0]?.total || 0,
        totalEmployees,
        presentToday,
        totalFuelTypes,
        totalNozzles,
        todayExtra,
        todayShort,
        fuelSalesBreakdown: Object.entries(fuelSalesMap).map(([name, data]) => ({
          fuelType: name,
          quantity: data.quantity,
          amount: data.amount,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
