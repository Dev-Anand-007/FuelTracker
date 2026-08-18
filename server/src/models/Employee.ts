import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  petrolPump: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  address: string;
  joiningDate: Date;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>({
  petrolPump: { type: Schema.Types.ObjectId, ref: 'PetrolPump', required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, default: '', trim: true },
  joiningDate: { type: Date, required: true },
  role: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IEmployee>('Employee', employeeSchema);
