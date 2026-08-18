import mongoose, { Document, Schema } from 'mongoose';

export interface IFuelRateHistory extends Document {
  petrolPump: mongoose.Types.ObjectId;
  fuelType: mongoose.Types.ObjectId;
  rate: number;
  effectiveFrom: Date;
  createdAt: Date;
  updatedAt: Date;
}

const fuelRateHistorySchema = new Schema<IFuelRateHistory>({
  petrolPump: { type: Schema.Types.ObjectId, ref: 'PetrolPump', required: true },
  fuelType: { type: Schema.Types.ObjectId, ref: 'FuelType', required: true },
  rate: { type: Number, required: true, min: 0 },
  effectiveFrom: { type: Date, required: true },
}, { timestamps: true });

fuelRateHistorySchema.index({ petrolPump: 1, fuelType: 1, effectiveFrom: -1 });

export default mongoose.model<IFuelRateHistory>('FuelRateHistory', fuelRateHistorySchema);
