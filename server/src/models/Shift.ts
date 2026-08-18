import mongoose, { Document, Schema } from 'mongoose';

export interface IMiscExpense extends Document {
  purpose: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const miscExpenseSchema = new Schema<IMiscExpense>({
  purpose: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
}, { timestamps: true });

export interface IShiftAdjustment extends Document {
  type: 'ADD' | 'SUBTRACT';
  amount: number;
  purpose: string;
  createdAt: Date;
  updatedAt: Date;
}

const shiftAdjustmentSchema = new Schema<IShiftAdjustment>({
  type: { type: String, enum: ['ADD', 'SUBTRACT'], required: true },
  amount: { type: Number, required: true, min: 0 },
  purpose: { type: String, required: true, trim: true },
}, { timestamps: true });

export interface IShift extends Document {
  petrolPump: mongoose.Types.ObjectId;
  shiftNumber: 1 | 2;
  date: Date;
  startTime: string;
  endTime: string;
  sales: mongoose.Types.ObjectId[];
  totalSalesAmount: number;
  testingAmount: number;
  tiffinAmount: number;
  miscExpenses: IMiscExpense[];
  totalMiscExpense: number;
  adjustments: IShiftAdjustment[];
  totalAddAdjustment: number;
  totalSubtractAdjustment: number;
  amountToSubmit: number;
  cashSubmitted: number;
  onlineSubmitted: number;
  totalSubmitted: number;
  difference: number;
  status: 'OPEN' | 'FINALIZED';
  finalizedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new Schema<IShift>({
  petrolPump: { type: Schema.Types.ObjectId, ref: 'PetrolPump', required: true },
  shiftNumber: { type: Number, enum: [1, 2], required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  sales: [{ type: Schema.Types.ObjectId, ref: 'ShiftSale' }],
  totalSalesAmount: { type: Number, default: 0 },
  testingAmount: { type: Number, default: 0 },
  tiffinAmount: { type: Number, default: 0 },
  miscExpenses: [miscExpenseSchema],
  totalMiscExpense: { type: Number, default: 0 },
  adjustments: [shiftAdjustmentSchema],
  totalAddAdjustment: { type: Number, default: 0 },
  totalSubtractAdjustment: { type: Number, default: 0 },
  amountToSubmit: { type: Number, default: 0 },
  cashSubmitted: { type: Number, default: 0 },
  onlineSubmitted: { type: Number, default: 0 },
  totalSubmitted: { type: Number, default: 0 },
  difference: { type: Number, default: 0 },
  status: { type: String, enum: ['OPEN', 'FINALIZED'], default: 'OPEN' },
  finalizedAt: { type: Date },
}, { timestamps: true });

shiftSchema.index({ petrolPump: 1, date: 1, shiftNumber: 1 }, { unique: true });

export const MiscExpense = mongoose.model<IMiscExpense>('MiscExpense', miscExpenseSchema);
export default mongoose.model<IShift>('Shift', shiftSchema);
