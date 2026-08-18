import mongoose, { Document, Schema } from 'mongoose';

export interface IPetrolPump extends Document {
  pumpName: string;
  address: string;
  pumpCode: string;
  phone: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(candidatePassword: string): Promise<boolean>;
}

const petrolPumpSchema = new Schema<IPetrolPump>({
  pumpName: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  pumpCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
}, { timestamps: true });

petrolPumpSchema.methods.matchPassword = async function (candidatePassword: string): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};

petrolPumpSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model<IPetrolPump>('PetrolPump', petrolPumpSchema);
