import { Schema, model, Document, Types } from 'mongoose';

export interface ISale extends Document {
  invoiceId: string;
  customerId: Types.ObjectId;
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  date: Date;
  createdBy: Types.ObjectId;
  storeId: Types.ObjectId;
  pointsEarned: number;
  pointsRedeemed: number;
}

const SaleSchema = new Schema<ISale>({
  invoiceId: { type: String, required: true, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  subtotal: { type: Number, required: true },
  gstTotal: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  pointsEarned: { type: Number, default: 0 },
  pointsRedeemed: { type: Number, default: 0 }
});

export default model<ISale>('Sale', SaleSchema);
