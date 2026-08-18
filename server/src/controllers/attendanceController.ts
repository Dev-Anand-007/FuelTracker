import { Response } from 'express';
import Attendance from '../models/Attendance';
import Employee from '../models/Employee';
import { AuthRequest } from '../middleware/auth';

export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, month, year } = req.query;
    let filter: any = { petrolPump: req.user._id };

    if (date) {
      const targetDate = new Date(date as string);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: targetDate, $lt: nextDay };
    } else if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.find(filter)
      .populate('employee', 'name phone role')
      .sort({ date: -1 });

    res.json({ success: true, data: attendance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      res.status(400).json({ success: false, message: 'Attendance records are required' });
      return;
    }

    const results = [];
    for (const record of records) {
      const { employee, date, status, shift } = record;

      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);

      const existing = await Attendance.findOne({
        petrolPump: req.user._id,
        employee,
        date: attendanceDate,
      });

      if (existing) {
        existing.status = status;
        existing.shift = status === 'present' ? shift : null;
        await existing.save();
        results.push(existing);
      } else {
        const newRecord = await Attendance.create({
          petrolPump: req.user._id,
          employee,
          date: attendanceDate,
          status,
          shift: status === 'present' ? shift : null,
        });
        results.push(newRecord);
      }
    }

    res.json({ success: true, message: 'Attendance marked', data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMonthlySummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, month, year } = req.query;

    if (!month || !year) {
      res.status(400).json({ success: false, message: 'Month and year are required' });
      return;
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

    const filter: any = {
      petrolPump: req.user._id,
      date: { $gte: startDate, $lte: endDate },
    };
    if (employeeId) filter.employee = employeeId;

    const attendance = await Attendance.find(filter).populate('employee', 'name phone role');

    const employees = await Employee.find({ petrolPump: req.user._id, isActive: true });
    const summary: any[] = [];

    for (const emp of employees) {
      const empRecords = attendance.filter(
        (a: any) => a.employee._id.toString() === emp._id.toString()
      );

      const present = empRecords.filter((a: any) => a.status === 'present').length;
      const absent = empRecords.filter((a: any) => a.status === 'absent').length;
      const leave = empRecords.filter((a: any) => a.status === 'leave').length;
      const shift1 = empRecords.filter((a: any) => a.shift === 'shift1').length;
      const shift2 = empRecords.filter((a: any) => a.shift === 'shift2').length;

      summary.push({
        employee: { _id: emp._id, name: emp.name, phone: emp.phone, role: emp.role },
        present,
        absent,
        leave,
        shift1,
        shift2,
        totalWorked: present,
      });
    }

    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
