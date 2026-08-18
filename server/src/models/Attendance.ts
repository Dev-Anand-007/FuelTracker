import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  petrolPump: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'leave';
  shift: 'shift1' | 'shift2' | null;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>({
  petrolPump: { type: Schema.Types.ObjectId, ref: 'PetrolPump', required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'leave'], required: true },
  shift: { type: String, enum: ['shift1', 'shift2', null], default: null },
}, { timestamps: true });

attendanceSchema.index({ petrolPump: 1, employee: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>('Attendance', attendanceSchema);
