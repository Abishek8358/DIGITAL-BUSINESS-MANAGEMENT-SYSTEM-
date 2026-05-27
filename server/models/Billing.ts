import { Schema, model, Document, Types } from 'mongoose';

export interface IBilling extends Document {
  storeId: Types.ObjectId;
  saleId?: Types.ObjectId; // Reference to Sale/Invoice record
  invoiceId: string; // Text invoice ID (e.g., INV-12345)
  amount: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'other';
  paymentStatus: 'paid' | 'pending' | 'failed';
  transactionId?: string;
  createdAt: Date;
}

const BillingSchema = new Schema<IBilling>({
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  saleId: { type: Schema.Types.ObjectId, ref: 'Sale' },
  invoiceId: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'other'], default: 'cash' },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'failed'], default: 'paid' },
  transactionId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default model<IBilling>('Billing', BillingSchema);
