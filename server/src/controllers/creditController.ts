import { Response } from 'express';
import mongoose from 'mongoose';
import CreditCustomer from '../models/CreditCustomer';
import CreditTransaction from '../models/CreditTransaction';
import CreditPayment from '../models/CreditPayment';
import FuelType from '../models/FuelType';
import { AuthRequest } from '../middleware/auth';

export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const customers = await CreditCustomer.find({ petrolPump: req.user._id }).sort({ name: 1 });
    res.json({ success: true, data: customers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, address } = req.body;
    if (!name || !phone) {
      res.status(400).json({ success: false, message: 'Name and phone are required' });
      return;
    }
    const customer = await CreditCustomer.create({
      petrolPump: req.user._id,
      name,
      phone,
      address: address || '',
    });
    res.status(201).json({ success: true, message: 'Customer created', data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, address, isActive } = req.body;

    const customer = await CreditCustomer.findOne({ _id: id, petrolPump: req.user._id });
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) customer.address = address;
    if (isActive !== undefined) customer.isActive = isActive;

    await customer.save();
    res.json({ success: true, message: 'Customer updated', data: customer });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const transactions = await CreditTransaction.find({
      petrolPump: req.user._id,
      ...(customerId && { customer: customerId }),
    })
      .populate('fuelType', 'name')
      .populate('customer', 'name phone')
      .sort({ date: -1 });
    res.json({ success: true, data: transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId, fuelTypeId, quantity, rate, date } = req.body;

    if (!customerId || !fuelTypeId || !quantity || !rate) {
      res.status(400).json({ success: false, message: 'Customer, fuel type, quantity, and rate are required' });
      return;
    }

    const customer = await CreditCustomer.findOne({ _id: customerId, petrolPump: req.user._id });
    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found' });
      return;
    }

    const fuelType = await FuelType.findOne({ _id: fuelTypeId, petrolPump: req.user._id });
    if (!fuelType) {
      res.status(404).json({ success: false, message: 'Fuel type not found' });
      return;
    }

    const totalAmount = quantity * rate;

    const transaction = await CreditTransaction.create({
      petrolPump: req.user._id,
      customer: customerId,
      fuelType: fuelTypeId,
      quantity,
      rate,
      totalAmount,
      paidAmount: 0,
      remainingAmount: totalAmount,
      date: date || new Date(),
      status: 'Pending',
    });

    customer.totalCredit += totalAmount;
    customer.remainingAmount += totalAmount;
    await customer.save();

    const populated = await transaction.populate([{ path: 'fuelType', select: 'name' }, { path: 'customer', select: 'name phone' }]);
    res.status(201).json({ success: true, message: 'Credit transaction created', data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const { amount, date, paymentMethod, note } = req.body;

    if (!amount || !paymentMethod) {
      res.status(400).json({ success: false, message: 'Amount and payment method are required' });
      return;
    }

    const transaction = await CreditTransaction.findOne({ _id: transactionId, petrolPump: req.user._id });
    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    if (amount > transaction.remainingAmount) {
      res.status(400).json({ success: false, message: `Payment cannot exceed remaining amount of ₹${transaction.remainingAmount}` });
      return;
    }

    const payment = await CreditPayment.create({
      petrolPump: req.user._id,
      creditTransaction: transactionId,
      customer: transaction.customer,
      amount,
      date: date || new Date(),
      paymentMethod,
      note: note || '',
    });

    transaction.paidAmount += amount;
    transaction.remainingAmount -= amount;

    if (transaction.remainingAmount === 0) {
      transaction.status = 'Paid';
    } else if (transaction.paidAmount > 0) {
      transaction.status = 'Partial';
    }

    await transaction.save();

    const customer = await CreditCustomer.findById(transaction.customer);
    if (customer) {
      customer.totalPaid += amount;
      customer.remainingAmount -= amount;
      await customer.save();
    }

    res.status(201).json({ success: true, message: 'Payment recorded', data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const payments = await CreditPayment.find({
      petrolPump: req.user._id,
      creditTransaction: transactionId,
    }).sort({ date: -1 });
    res.json({ success: true, data: payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
