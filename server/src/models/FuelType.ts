import mongoose, { Document, Schema } from 'mongoose';

export interface IFuelType extends Document {
  petrolPump: mongoose.Types.ObjectId;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const fuelTypeSchema = new Schema<IFuelType>({
  petrolPump: { type: Schema.Types.ObjectId, ref: 'PetrolPump', required: true },
  name: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

fuelTypeSchema.index({ petrolPump: 1, name: 1 }, { unique: true });

export default mongoose.model<IFuelType>('FuelType', fuelTypeSchema);
