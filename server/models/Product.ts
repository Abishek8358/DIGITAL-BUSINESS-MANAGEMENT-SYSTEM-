import { Schema, model, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  categoryId?: Types.ObjectId;
  brand?: string;
  costPrice: number;
  sellingPrice: number;
  gstPercent: number;
  stock: number;
  minimumStock: number;
  reorderQuantity: number;
  imageUrl?: string;
  description?: string;
  storeId: Types.ObjectId;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  brand: { type: String },
  costPrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  minimumStock: { type: Number, default: 5 },
  reorderQuantity: { type: Number, default: 10 },
  imageUrl: { type: String },
  description: { type: String },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  createdAt: { type: Date, default: Date.now }
});

// A product with the same name AND brand must be unique within a store
ProductSchema.index({ name: 1, brand: 1, storeId: 1 }, { unique: true });

export default model<IProduct>('Product', ProductSchema);
