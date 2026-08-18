import { Response } from 'express';
import Employee from '../models/Employee';
import { AuthRequest } from '../middleware/auth';

export const getEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employees = await Employee.find({ petrolPump: req.user._id }).sort({ name: 1 });
    res.json({ success: true, data: employees });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, address, joiningDate, role } = req.body;
    if (!name || !phone || !joiningDate || !role) {
      res.status(400).json({ success: false, message: 'Name, phone, joining date, and role are required' });
      return;
    }

    const employee = await Employee.create({
      petrolPump: req.user._id,
      name,
      phone,
      address: address || '',
      joiningDate,
      role,
    });

    res.status(201).json({ success: true, message: 'Employee added', data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, address, joiningDate, role, isActive } = req.body;

    const employee = await Employee.findOne({ _id: id, petrolPump: req.user._id });
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    if (name !== undefined) employee.name = name;
    if (phone !== undefined) employee.phone = phone;
    if (address !== undefined) employee.address = address;
    if (joiningDate !== undefined) employee.joiningDate = joiningDate;
    if (role !== undefined) employee.role = role;
    if (isActive !== undefined) employee.isActive = isActive;

    await employee.save();
    res.json({ success: true, message: 'Employee updated', data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const employee = await Employee.findOne({ _id: id, petrolPump: req.user._id });
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }
    employee.isActive = false;
    await employee.save();
    res.json({ success: true, message: 'Employee deactivated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
