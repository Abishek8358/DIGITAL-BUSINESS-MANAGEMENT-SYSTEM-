import { Schema, model, Document, Types } from 'mongoose';

export interface IStoreSettings extends Document {
  storeId: Types.ObjectId;
  currency: string;
  defaultGst: number;
  invoicePrefix: string;
  invoiceFooter: string;
  lowStockThreshold: number;
  criticalStockThreshold: number;
  enableStockNotifications: boolean;
  defaultSalesSalary: number;
  defaultManagerSalary: number;
  defaultHelperSalary: number;
}

const StoreSettingsSchema = new Schema<IStoreSettings>({
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, unique: true },
  currency: { type: String, default: 'INR' },
  defaultGst: { type: Number, default: 18 },
  invoicePrefix: { type: String, default: 'INV' },
  invoiceFooter: { type: String, default: 'Thank you for shopping!' },
  lowStockThreshold: { type: Number, default: 5 },
  criticalStockThreshold: { type: Number, default: 2 },
  enableStockNotifications: { type: Boolean, default: true },
  defaultSalesSalary: { type: Number, default: 0 },
  defaultManagerSalary: { type: Number, default: 0 },
  defaultHelperSalary: { type: Number, default: 0 }
});

export default model<IStoreSettings>('StoreSettings', StoreSettingsSchema);
