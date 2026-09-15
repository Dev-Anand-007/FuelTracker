import { Response } from 'express';
import VehicleReport from '../models/VehicleReport';
import { AuthRequest } from '../middleware/auth';

export const getReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let report = await VehicleReport.findOne({ petrolPump: req.user._id });
    if (!report) {
      report = await VehicleReport.create({ petrolPump: req.user._id, vehicles: [] });
    }
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePartyName = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { partyName } = req.body;
    const report = await VehicleReport.findOneAndUpdate(
      { petrolPump: req.user._id },
      { partyName: partyName || '' },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePumpDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pumpName, address, mobile } = req.body;
    let report = await VehicleReport.findOne({ petrolPump: req.user._id });
    if (!report) {
      report = await VehicleReport.create({ petrolPump: req.user._id, vehicles: [] });
    }
    if (pumpName !== undefined) report.pumpName = pumpName;
    if (address !== undefined) report.address = address;
    if (mobile !== undefined) report.mobile = mobile;
    await report.save();
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleNumber } = req.body;
    if (!vehicleNumber || !vehicleNumber.trim()) {
      res.status(400).json({ success: false, message: 'Vehicle number is required' });
      return;
    }

    let report = await VehicleReport.findOne({ petrolPump: req.user._id });
    if (!report) {
      report = await VehicleReport.create({ petrolPump: req.user._id, vehicles: [] });
    }

    const exists = report.vehicles.some(
      (v) => v.vehicleNumber.toUpperCase() === vehicleNumber.trim().toUpperCase()
    );
    if (exists) {
      res.status(400).json({ success: false, message: 'Vehicle number already exists' });
      return;
    }

    report.vehicles.push({ vehicleNumber: vehicleNumber.trim().toUpperCase(), transactions: [] });
    await report.save();

    res.status(201).json({ success: true, message: 'Vehicle added', data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const report = await VehicleReport.findOne({ petrolPump: req.user._id });
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    report.vehicles = report.vehicles.filter((v) => v._id?.toString() !== vehicleId);
    await report.save();

    res.json({ success: true, message: 'Vehicle removed', data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const { date, amount } = req.body;

    if (!date || amount === undefined || amount === null) {
      res.status(400).json({ success: false, message: 'Date and amount are required' });
      return;
    }

    const report = await VehicleReport.findOne({ petrolPump: req.user._id });
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    const vehicle = report.vehicles.find((v) => v._id?.toString() === vehicleId);
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }

    vehicle.transactions.push({ date: new Date(date), amount: Number(amount) });
    await report.save();

    res.status(201).json({ success: true, message: 'Transaction added', data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { vehicleId, txnId } = req.params;
    const report = await VehicleReport.findOne({ petrolPump: req.user._id });
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }

    const vehicle = report.vehicles.find((v) => v._id?.toString() === vehicleId);
    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }

    vehicle.transactions = vehicle.transactions.filter((t: any) => t._id?.toString() !== txnId);
    await report.save();

    res.json({ success: true, message: 'Transaction removed', data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
