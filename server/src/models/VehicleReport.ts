import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicleTransaction {
  _id?: mongoose.Types.ObjectId;
  date: Date;
  amount: number;
}

export interface IVehicle {
  _id?: mongoose.Types.ObjectId;
  vehicleNumber: string;
  transactions: IVehicleTransaction[];
}

export interface IVehicleReport extends Document {
  petrolPump: mongoose.Types.ObjectId;
  pumpName: string;
  address: string;
  mobile: string;
  partyName: string;
  vehicles: IVehicle[];
  createdAt: Date;
  updatedAt: Date;
}

const vehicleTransactionSchema = new Schema<IVehicleTransaction>({
  date: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0 },
}, { _id: true });

const vehicleSchema = new Schema<IVehicle>({
  vehicleNumber: { type: String, required: true, trim: true, uppercase: true },
  transactions: [vehicleTransactionSchema],
}, { _id: true });

const vehicleReportSchema = new Schema<IVehicleReport>({
  petrolPump: { type: Schema.Types.ObjectId, ref: 'PetrolPump', required: true, unique: true },
  pumpName: { type: String, default: '', trim: true },
  address: { type: String, default: '', trim: true },
  mobile: { type: String, default: '', trim: true },
  partyName: { type: String, default: '', trim: true },
  vehicles: [vehicleSchema],
}, { timestamps: true });

export default mongoose.model<IVehicleReport>('VehicleReport', vehicleReportSchema);
