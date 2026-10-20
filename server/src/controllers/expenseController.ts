import { Response } from 'express';
import mongoose from 'mongoose';
import Expense from '../models/Expense';
import PetrolPump from '../models/PetrolPump';
import { AuthRequest } from '../middleware/auth';

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const filter: any = { petrolPump: req.user._id };

    if (startDate && endDate) {
      // Include the full end date by setting time to end of day
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      filter.date = {
        $gte: start,
        $lte: end,
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      filter.date = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json({ success: true, data: expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, amount, description } = req.body;
    if (!date || !amount) {
      res.status(400).json({ success: false, message: 'Date and amount are required' });
      return;
    }
    const expense = new Expense({
      petrolPump: req.user._id,
      date: new Date(date),
      amount: Number(amount),
      description: description || '',
    });
    await expense.save();
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date, amount, description } = req.body;
    
    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (amount !== undefined) updateData.amount = Number(amount);
    if (description !== undefined) updateData.description = description;

    const expense = await Expense.findOneAndUpdate(
      { _id: id, petrolPump: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const expense = await Expense.findOneAndDelete({ _id: id, petrolPump: req.user._id });
    if (!expense) {
      res.status(404).json({ success: false, message: 'Expense not found' });
      return;
    }
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};