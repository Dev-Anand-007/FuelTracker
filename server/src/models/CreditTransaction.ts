import mongoose, { Document, Schema } from 'mongoose';

export interface ICreditTransaction extends Document {
  petrolPump: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  fuelType: mongoose.Types.ObjectId;
  quantity: number;
  rate: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  date: Date;
  status: 'Pending' | 'Partial' | 'Paid';
  createdAt: Date;
  updatedAt: Date;
}

const creditTransactionSchema = new Schema<ICreditTransaction>({
  petrolPump: { type: Schema.Types.ObjectId, ref: 'PetrolPump', required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'CreditCustomer', required: true },
  fuelType: { type: Schema.Types.ObjectId, ref: 'FuelType', required: true },
  quantity: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
}, { timestamps: true });

export default mongoose.model<ICreditTransaction>('CreditTransaction', creditTransactionSchema);
