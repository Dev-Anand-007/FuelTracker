import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  petrolPump: mongoose.Types.ObjectId;
  date: Date;
  amount: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>({
  petrolPump: { type: Schema.Types.ObjectId, ref: 'PetrolPump', required: true },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<IExpense>('Expense', expenseSchema);