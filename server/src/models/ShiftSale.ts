import mongoose, { Document, Schema } from 'mongoose';

export interface IShiftSale extends Document {
  nozzle: mongoose.Types.ObjectId;
  fuelType: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  rate: number;
  openingReading: number;
  closingReading: number;
  quantity: number;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const shiftSaleSchema = new Schema<IShiftSale>({
  nozzle: { type: Schema.Types.ObjectId, ref: 'Nozzle', required: true },
  fuelType: { type: Schema.Types.ObjectId, ref: 'FuelType', required: true },
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  rate: { type: Number, required: true },
  openingReading: { type: Number, required: true },
  closingReading: { type: Number, required: true },
  quantity: { type: Number, required: true },
  amount: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model<IShiftSale>('ShiftSale', shiftSaleSchema);
