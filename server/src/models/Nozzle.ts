import mongoose, { Document, Schema } from 'mongoose';

export interface INozzle extends Document {
  petrolPump: mongoose.Types.ObjectId;
  name: string;
  fuelType: mongoose.Types.ObjectId;
  openingMeter: number;
  currentMeter: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const nozzleSchema = new Schema<INozzle>({
  petrolPump: { type: Schema.Types.ObjectId, ref: 'PetrolPump', required: true },
  name: { type: String, required: true, trim: true },
  fuelType: { type: Schema.Types.ObjectId, ref: 'FuelType', required: true },
  openingMeter: { type: Number, required: true, default: 0 },
  currentMeter: { type: Number, required: true, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<INozzle>('Nozzle', nozzleSchema);
