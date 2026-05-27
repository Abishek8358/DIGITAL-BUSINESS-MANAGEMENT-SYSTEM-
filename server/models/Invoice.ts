import { Schema, model, Document, Types } from 'mongoose';

export interface IInvoice extends Document {
  invoiceId: string;
  customerId: Types.ObjectId;
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  date: Date;
  createdBy: Types.ObjectId;
  storeId: Types.ObjectId;
  paymentStatus: 'paid' | 'unpaid' | 'partially_paid';
}

const InvoiceSchema = new Schema<IInvoice>({
  invoiceId: { type: String, required: true, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  subtotal: { type: Number, required: true },
  gstTotal: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  paymentStatus: { type: String, enum: ['paid', 'unpaid', 'partially_paid'], default: 'paid' }
});

export default model<IInvoice>('Invoice', InvoiceSchema);
