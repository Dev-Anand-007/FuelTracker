import { Response } from 'express';
import FuelRateHistory from '../models/FuelRateHistory';
import FuelType from '../models/FuelType';
import { AuthRequest } from '../middleware/auth';

export const getRates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fuelTypeId } = req.params;
    const rates = await FuelRateHistory.find({
      petrolPump: req.user._id,
      fuelType: fuelTypeId,
    }).sort({ effectiveFrom: -1 });
    res.json({ success: true, data: rates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCurrentRate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fuelTypeId } = req.params;
    const now = new Date();
    const rate = await FuelRateHistory.findOne({
      petrolPump: req.user._id,
      fuelType: fuelTypeId,
      effectiveFrom: { $lte: now },
    }).sort({ effectiveFrom: -1 });

    res.json({ success: true, data: rate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCurrentRatesAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fuelTypes = await FuelType.find({ petrolPump: req.user._id, isActive: true });
    const now = new Date();
    const result = [];

    for (const ft of fuelTypes) {
      const rate = await FuelRateHistory.findOne({
        petrolPump: req.user._id,
        fuelType: ft._id,
        effectiveFrom: { $lte: now },
      }).sort({ effectiveFrom: -1 });

      result.push({
        fuelType: ft,
        currentRate: rate ? rate.rate : 0,
        effectiveFrom: rate ? rate.effectiveFrom : null,
      });
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addRate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fuelTypeId } = req.params;
    const { rate, effectiveFrom } = req.body;

    if (!rate || !effectiveFrom) {
      res.status(400).json({ success: false, message: 'Rate and effective date are required' });
      return;
    }

    const fuelType = await FuelType.findOne({ _id: fuelTypeId, petrolPump: req.user._id });
    if (!fuelType) {
      res.status(404).json({ success: false, message: 'Fuel type not found' });
      return;
    }

    const rateRecord = await FuelRateHistory.create({
      petrolPump: req.user._id,
      fuelType: fuelTypeId,
      rate,
      effectiveFrom: new Date(effectiveFrom),
    });

    res.status(201).json({ success: true, message: 'Rate added', data: rateRecord });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRateForDate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fuelTypeId } = req.params;
    const { date } = req.query;

    const targetDate = date ? new Date(date as string) : new Date();
    const rate = await FuelRateHistory.findOne({
      petrolPump: req.user._id,
      fuelType: fuelTypeId,
      effectiveFrom: { $lte: targetDate },
    }).sort({ effectiveFrom: -1 });

    res.json({ success: true, data: rate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
