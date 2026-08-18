import { Request, Response } from 'express';
import PetrolPump from '../models/PetrolPump';
import { generateToken } from '../utils/helpers';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pumpName, address, pumpCode, phone, password } = req.body;

    if (!pumpName || !address || !pumpCode || !phone || !password) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    const existing = await PetrolPump.findOne({ pumpCode: pumpCode.toUpperCase() });
    if (existing) {
      res.status(400).json({ success: false, message: 'Pump code already exists' });
      return;
    }

    const pump = await PetrolPump.create({
      pumpName,
      address,
      pumpCode: pumpCode.toUpperCase(),
      phone,
      password,
    });

    const token = generateToken(pump._id.toString());

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        _id: pump._id,
        pumpName: pump.pumpName,
        address: pump.address,
        pumpCode: pump.pumpCode,
        phone: pump.phone,
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pumpCode, password } = req.body;

    if (!pumpCode || !password) {
      res.status(400).json({ success: false, message: 'Pump code and password are required' });
      return;
    }

    const pump = await PetrolPump.findOne({ pumpCode: pumpCode.toUpperCase() });
    if (!pump) {
      res.status(401).json({ success: false, message: 'Invalid pump code or password' });
      return;
    }

    const isMatch = await pump.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid pump code or password' });
      return;
    }

    const token = generateToken(pump._id.toString());

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: pump._id,
        pumpName: pump.pumpName,
        address: pump.address,
        pumpCode: pump.pumpCode,
        phone: pump.phone,
        token,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pumpCode, phone } = req.body;

    if (!pumpCode || !phone) {
      res.status(400).json({ success: false, message: 'Pump code and phone are required' });
      return;
    }

    const pump = await PetrolPump.findOne({ pumpCode: pumpCode.toUpperCase(), phone });
    if (!pump) {
      res.status(404).json({ success: false, message: 'No pump found with these details' });
      return;
    }

    res.json({
      success: true,
      message: 'Password reset is handled by admin. Contact support.',
      data: { pumpCode: pump.pumpCode },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
