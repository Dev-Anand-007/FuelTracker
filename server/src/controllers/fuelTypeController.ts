import { Response } from 'express';
import FuelType from '../models/FuelType';
import { AuthRequest } from '../middleware/auth';

export const getFuelTypes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fuelTypes = await FuelType.find({ petrolPump: req.user._id }).sort({ name: 1 });
    res.json({ success: true, data: fuelTypes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFuelType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Fuel type name is required' });
      return;
    }

    const existing = await FuelType.findOne({ petrolPump: req.user._id, name: name.trim() });
    if (existing) {
      res.status(400).json({ success: false, message: 'Fuel type already exists' });
      return;
    }

    const fuelType = await FuelType.create({ petrolPump: req.user._id, name: name.trim() });
    res.status(201).json({ success: true, message: 'Fuel type created', data: fuelType });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFuelType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const fuelType = await FuelType.findOne({ _id: id, petrolPump: req.user._id });
    if (!fuelType) {
      res.status(404).json({ success: false, message: 'Fuel type not found' });
      return;
    }

    if (name !== undefined) fuelType.name = name.trim();
    if (isActive !== undefined) fuelType.isActive = isActive;

    await fuelType.save();
    res.json({ success: true, message: 'Fuel type updated', data: fuelType });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFuelType = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const fuelType = await FuelType.findOneAndDelete({ _id: id, petrolPump: req.user._id });
    if (!fuelType) {
      res.status(404).json({ success: false, message: 'Fuel type not found' });
      return;
    }
    res.json({ success: true, message: 'Fuel type deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
