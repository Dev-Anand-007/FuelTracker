import { Response } from 'express';
import Nozzle from '../models/Nozzle';
import { AuthRequest } from '../middleware/auth';

export const getNozzles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const nozzles = await Nozzle.find({ petrolPump: req.user._id })
      .populate('fuelType', 'name')
      .sort({ name: 1 });
    res.json({ success: true, data: nozzles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createNozzle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, fuelType, openingMeter } = req.body;
    if (!name || !fuelType) {
      res.status(400).json({ success: false, message: 'Name and fuel type are required' });
      return;
    }

    const nozzle = await Nozzle.create({
      petrolPump: req.user._id,
      name,
      fuelType,
      openingMeter: openingMeter || 0,
      currentMeter: openingMeter || 0,
    });

    const populated = await nozzle.populate('fuelType', 'name');
    res.status(201).json({ success: true, message: 'Nozzle created', data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateNozzle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, fuelType, openingMeter, currentMeter, isActive } = req.body;

    const nozzle = await Nozzle.findOne({ _id: id, petrolPump: req.user._id });
    if (!nozzle) {
      res.status(404).json({ success: false, message: 'Nozzle not found' });
      return;
    }

    if (name !== undefined) nozzle.name = name;
    if (fuelType !== undefined) nozzle.fuelType = fuelType;
    if (openingMeter !== undefined) nozzle.openingMeter = openingMeter;
    if (currentMeter !== undefined) nozzle.currentMeter = currentMeter;
    if (isActive !== undefined) nozzle.isActive = isActive;

    await nozzle.save();
    const populated = await nozzle.populate('fuelType', 'name');
    res.json({ success: true, message: 'Nozzle updated', data: populated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNozzle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const nozzle = await Nozzle.findOneAndDelete({ _id: id, petrolPump: req.user._id });
    if (!nozzle) {
      res.status(404).json({ success: false, message: 'Nozzle not found' });
      return;
    }
    res.json({ success: true, message: 'Nozzle deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
