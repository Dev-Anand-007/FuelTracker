import mongoose, { Document, Schema } from 'mongoose';

export interface ICreditPayment extends Document {
  petrolPump: mongoose.Types.ObjectId;
  creditTransaction: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  paymentMethod: 'Cash' | 'Online';
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const creditPaymentSchema = new Schema<ICreditPayment>({
  petrolPump: { type: Schema.Types.ObjectId, ref: 'PetrolPump', required: true },
  creditTransaction: { type: Schema.Types.ObjectId, ref: 'CreditTransaction', required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'CreditCustomer', required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Online'], required: true },
  note: { type: String, default: '', trim: true },
}, { timestamps: true });

export default mongoose.model<ICreditPayment>('CreditPayment', creditPaymentSchema);
