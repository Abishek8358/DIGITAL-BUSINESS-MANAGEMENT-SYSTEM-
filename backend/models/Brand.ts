import { Schema, model, Document, Types } from 'mongoose';

export interface IBrand extends Document {
  productId: Types.ObjectId;
  storeId: Types.ObjectId;
  name: string;
}

const BrandSchema = new Schema<IBrand>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  name: { type: String, required: true }
});

// Brand name must be unique per product
BrandSchema.index({ productId: 1, name: 1 }, { unique: true });

export default model<IBrand>('Brand', BrandSchema);
