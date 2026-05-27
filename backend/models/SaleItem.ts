import { Schema, model, Document, Types } from 'mongoose';

export interface ISaleItem extends Document {
  saleId: Types.ObjectId;
  productId: Types.ObjectId;
  variantId?: Types.ObjectId;
  quantity: number;
  unitPrice: number;
  gstAmount: number;
  total: number;
}

const SaleItemSchema = new Schema<ISaleItem>({
  saleId: { type: Schema.Types.ObjectId, ref: 'Sale', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId, ref: 'Variant' },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  gstAmount: { type: Number, required: true },
  total: { type: Number, required: true }
});

export default model<ISaleItem>('SaleItem', SaleItemSchema);
