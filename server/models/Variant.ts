import { Schema, model, Document, Types } from 'mongoose';

export interface IVariant extends Document {
  brandId: Types.ObjectId;
  storeId: Types.ObjectId;
  variantName: string;
  sellingPrice: number;
  costPrice: number;
  gstPercent: number;
  stock: number;
  minimumStock: number;
  imageUrl?: string;
}

const VariantSchema = new Schema<IVariant>({
  brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  variantName: { type: String, required: true },
  sellingPrice: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  minimumStock: { type: Number, default: 5 },
  imageUrl: { type: String }
});

// Variant name must be unique per brand
VariantSchema.index({ brandId: 1, variantName: 1 }, { unique: true });

export default model<IVariant>('Variant', VariantSchema);
