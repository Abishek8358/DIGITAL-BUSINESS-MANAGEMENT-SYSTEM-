import { Schema, model, Document, Types } from 'mongoose';

export interface IInventory extends Document {
  productId: Types.ObjectId;
  variantId?: Types.ObjectId; // Reference to specific Variant if any
  storeId: Types.ObjectId;
  quantity: number; // Current stock level
  lastUpdated: Date;
  updateReason: string; // e.g. "Restock", "Sale Checkout", "Manual adjustment"
}

const InventorySchema = new Schema<IInventory>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId, ref: 'Variant' },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  quantity: { type: Number, required: true, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  updateReason: { type: String, default: 'Initial stock entry' }
});

export default model<IInventory>('Inventory', InventorySchema);
