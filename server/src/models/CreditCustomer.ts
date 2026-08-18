import mongoose, { Document, Schema } from 'mongoose';

export interface ICreditCustomer extends Document {
  petrolPump: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  address: string;
  isActive: boolean;
  totalCredit: number;
  totalPaid: number;
  remainingAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const creditCustomerSchema = new Schema<ICreditCustomer>({
  petrolPump: { type: Schema.Types.ObjectId, ref: 'PetrolPump', required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, default: '', trim: true },
  isActive: { type: Boolean, default: true },
  totalCredit: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<ICreditCustomer>('CreditCustomer', creditCustomerSchema);
