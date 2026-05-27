import { Schema, model, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  storeId: Types.ObjectId;
}

const CategorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true }
});

// Category name must be unique per store
CategorySchema.index({ name: 1, storeId: 1 }, { unique: true });

export default model<ICategory>('Category', CategorySchema);
