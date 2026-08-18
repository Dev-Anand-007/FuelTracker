import { Response } from 'express';
import mongoose from 'mongoose';
import Shift from '../models/Shift';
import ShiftSale from '../models/ShiftSale';
import FuelRateHistory from '../models/FuelRateHistory';
import Nozzle from '../models/Nozzle';
import Employee from '../models/Employee';
import { AuthRequest } from '../middleware/auth';
import { calculateAmountToSubmit } from '../utils/helpers';

export const getShifts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, status } = req.query;
    const filter: any = { petrolPump: req.user._id };

    if (date) {
      const targetDate = new Date(date as string);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: targetDate, $lt: nextDay };
    }
    if (status) filter.status = status;

    const shifts = await Shift.find(filter)
      .populate({
        path: 'sales',
        populate: [
          { path: 'fuelType', model: 'FuelType', select: 'name' },
          { path: 'nozzle', model: 'Nozzle', select: 'name' },
          { path: 'employee', model: 'Employee', select: 'name' },
        ],
      })
      .sort({ date: -1, shiftNumber: 1 });

    res.json({ success: true, data: shifts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getShiftById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shift = await Shift.findOne({ _id: req.params.id, petrolPump: req.user._id })
      .populate({
        path: 'sales',
        populate: [
          { path: 'fuelType', model: 'FuelType', select: 'name' },
          { path: 'nozzle', model: 'Nozzle', select: 'name' },
          { path: 'employee', model: 'Employee', select: 'name' },
        ],
      });

    if (!shift) {
      res.status(404).json({ success: false, message: 'Shift not found' });
      return;
    }
    res.json({ success: true, data: shift });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shiftNumber, date } = req.body;

    if (!shiftNumber || !date) {
      res.status(400).json({ success: false, message: 'Shift number and date are required' });
      return;
    }

    const shiftDate = new Date(date);
    shiftDate.setHours(0, 0, 0, 0);

    const existing = await Shift.findOne({
      petrolPump: req.user._id,
      shiftNumber,
      date: shiftDate,
    });
    if (existing) {
      res.status(400).json({ success: false, message: 'Shift already exists for this date' });
      return;
    }

    const shift = await Shift.create({
      petrolPump: req.user._id,
      shiftNumber,
      date: shiftDate,
      startTime: shiftNumber === 1 ? '06:00' : '14:00',
      endTime: shiftNumber === 1 ? '14:00' : '22:00',
    });

    res.status(201).json({ success: true, message: 'Shift created', data: shift });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addSale = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shiftId } = req.params;
    const { nozzleId, openingReading, closingReading, employeeId } = req.body;

    const shift = await Shift.findOne({ _id: shiftId, petrolPump: req.user._id });
    if (!shift) {
      res.status(404).json({ success: false, message: 'Shift not found' });
      return;
    }

    if (shift.status === 'FINALIZED') {
      res.status(400).json({ success: false, message: 'Cannot add sales to a finalized shift' });
      return;
    }

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee is required' });
      return;
    }

    const nozzle = await Nozzle.findOne({ _id: nozzleId, petrolPump: req.user._id });
    if (!nozzle) {
      res.status(404).json({ success: false, message: 'Nozzle not found' });
      return;
    }

    const quantity = Math.round((closingReading - openingReading) * 100) / 100;
    if (quantity < 0) {
      res.status(400).json({ success: false, message: 'Closing reading must be greater than opening' });
      return;
    }

    const rateRecord = await FuelRateHistory.findOne({
      petrolPump: req.user._id,
      fuelType: nozzle.fuelType,
      effectiveFrom: { $lte: shift.date },
    }).sort({ effectiveFrom: -1 });

    if (!rateRecord) {
      res.status(400).json({ success: false, message: 'No rate found for this fuel type on this date' });
      return;
    }

    const amount = Math.round(quantity * rateRecord.rate * 100) / 100;

    const sale = await ShiftSale.create({
      nozzle: nozzleId,
      fuelType: nozzle.fuelType,
      employee: employeeId,
      rate: Math.round(rateRecord.rate * 100) / 100,
      openingReading,
      closingReading,
      quantity,
      amount,
    });

    shift.sales.push(sale._id as mongoose.Types.ObjectId);
    shift.totalSalesAmount += amount;
    await recalculateShift(shift);
    await shift.save();

    const populated = await sale.populate([{ path: 'fuelType', select: 'name' }, { path: 'nozzle', select: 'name' }, { path: 'employee', select: 'name' }]);
    res.status(201).json({ success: true, message: 'Sale added', data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeSale = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shiftId, saleId } = req.params;

    const shift = await Shift.findOne({ _id: shiftId, petrolPump: req.user._id });
    if (!shift) {
      res.status(404).json({ success: false, message: 'Shift not found' });
      return;
    }

    if (shift.status === 'FINALIZED') {
      res.status(400).json({ success: false, message: 'Cannot remove sales from a finalized shift' });
      return;
    }

    const sale = await ShiftSale.findById(saleId);
    if (!sale) {
      res.status(404).json({ success: false, message: 'Sale not found' });
      return;
    }

    shift.totalSalesAmount -= sale.amount;
    shift.sales = shift.sales.filter((s: any) => s.toString() !== saleId);
    await ShiftSale.findByIdAndDelete(saleId);
    await recalculateShift(shift);
    await shift.save();

    res.json({ success: true, message: 'Sale removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSale = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shiftId, saleId } = req.params;
    const { nozzleId, employeeId, openingReading, closingReading } = req.body;

    const shift = await Shift.findOne({ _id: shiftId, petrolPump: req.user._id });
    if (!shift) {
      res.status(404).json({ success: false, message: 'Shift not found' });
      return;
    }

    if (shift.status === 'FINALIZED') {
      res.status(400).json({ success: false, message: 'Cannot edit sales in a finalized shift' });
      return;
    }

    const existingSale = await ShiftSale.findById(saleId);
    if (!existingSale) {
      res.status(404).json({ success: false, message: 'Sale not found' });
      return;
    }

    const nozzle = await Nozzle.findOne({ _id: nozzleId, petrolPump: req.user._id });
    if (!nozzle) {
      res.status(404).json({ success: false, message: 'Nozzle not found' });
      return;
    }

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee is required' });
      return;
    }

    const quantity = Math.round((closingReading - openingReading) * 100) / 100;
    if (quantity < 0) {
      res.status(400).json({ success: false, message: 'Closing reading must be greater than opening' });
      return;
    }

    const rateRecord = await FuelRateHistory.findOne({
      petrolPump: req.user._id,
      fuelType: nozzle.fuelType,
      effectiveFrom: { $lte: shift.date },
    }).sort({ effectiveFrom: -1 });

    if (!rateRecord) {
      res.status(400).json({ success: false, message: 'No rate found for this fuel type on this date' });
      return;
    }

    const newAmount = Math.round(quantity * rateRecord.rate * 100) / 100;

    shift.totalSalesAmount -= existingSale.amount;
    existingSale.nozzle = nozzleId;
    existingSale.fuelType = nozzle.fuelType;
    existingSale.employee = employeeId;
    existingSale.openingReading = openingReading;
    existingSale.closingReading = closingReading;
    existingSale.quantity = quantity;
    existingSale.rate = Math.round(rateRecord.rate * 100) / 100;
    existingSale.amount = newAmount;
    await existingSale.save();

    shift.totalSalesAmount += newAmount;
    await recalculateShift(shift);
    await shift.save();

    const populated = await existingSale.populate([{ path: 'fuelType', select: 'name' }, { path: 'nozzle', select: 'name' }, { path: 'employee', select: 'name' }]);
    res.json({ success: true, message: 'Sale updated', data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettlement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shiftId } = req.params;
    const { testingAmount, tiffinAmount, miscExpenses, adjustments, cashSubmitted, onlineSubmitted } = req.body;

    const shift = await Shift.findOne({ _id: shiftId, petrolPump: req.user._id });
    if (!shift) {
      res.status(404).json({ success: false, message: 'Shift not found' });
      return;
    }

    if (shift.status === 'FINALIZED') {
      res.status(400).json({ success: false, message: 'Cannot update finalized shift' });
      return;
    }

    if (testingAmount !== undefined) shift.testingAmount = Number(testingAmount) || 0;
    if (tiffinAmount !== undefined) shift.tiffinAmount = Number(tiffinAmount) || 0;
    if (miscExpenses !== undefined) {
      shift.miscExpenses = miscExpenses;
      shift.totalMiscExpense = miscExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
    }
    if (adjustments !== undefined) {
      shift.adjustments = adjustments;
      shift.totalAddAdjustment = adjustments
        .filter((a: any) => a.type === 'ADD')
        .reduce((sum: number, a: any) => sum + (Number(a.amount) || 0), 0);
      shift.totalSubtractAdjustment = adjustments
        .filter((a: any) => a.type === 'SUBTRACT')
        .reduce((sum: number, a: any) => sum + (Number(a.amount) || 0), 0);
    }

    if (cashSubmitted !== undefined) shift.cashSubmitted = Number(cashSubmitted) || 0;
    if (onlineSubmitted !== undefined) shift.onlineSubmitted = Number(onlineSubmitted) || 0;

    await recalculateShift(shift);
    await shift.save();

    res.json({ success: true, message: 'Settlement updated', data: shift });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const finalizeShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shiftId } = req.params;

    const shift = await Shift.findOne({ _id: shiftId, petrolPump: req.user._id });
    if (!shift) {
      res.status(404).json({ success: false, message: 'Shift not found' });
      return;
    }

    if (shift.status === 'FINALIZED') {
      res.status(400).json({ success: false, message: 'Shift is already finalized' });
      return;
    }

    shift.status = 'FINALIZED';
    shift.finalizedAt = new Date();
    await shift.save();

    res.json({ success: true, message: 'Shift finalized', data: shift });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reopenShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { shiftId } = req.params;

    const shift = await Shift.findOne({ _id: shiftId, petrolPump: req.user._id });
    if (!shift) {
      res.status(404).json({ success: false, message: 'Shift not found' });
      return;
    }

    if (shift.status === 'OPEN') {
      res.status(400).json({ success: false, message: 'Shift is already open' });
      return;
    }

    shift.status = 'OPEN';
    shift.finalizedAt = undefined;
    await shift.save();

    res.json({ success: true, message: 'Shift reopened', data: shift });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const recalculateShift = async (shift: any) => {
  shift.amountToSubmit = calculateAmountToSubmit(
    shift.totalSalesAmount,
    shift.testingAmount,
    shift.tiffinAmount,
    shift.totalMiscExpense,
    shift.totalAddAdjustment,
    shift.totalSubtractAdjustment
  );
  shift.totalSubmitted = shift.cashSubmitted + shift.onlineSubmitted;
  shift.difference = shift.totalSubmitted - shift.amountToSubmit;
};
