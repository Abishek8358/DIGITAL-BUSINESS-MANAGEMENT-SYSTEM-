import { Schema, model, Document } from 'mongoose';

export interface IStore extends Document {
  storeName: string;
  ownerName: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  logoUrl?: string;
  isSetupComplete: number; // 0 or 1
  createdAt: Date;
}

const StoreSchema = new Schema<IStore>({
  storeName: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  gstNumber: { type: String },
  logoUrl: { type: String },
  isSetupComplete: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default model<IStore>('Store', StoreSchema);
