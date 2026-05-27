import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone?: string;
  storeId: Types.ObjectId;
  totalSpent: number;
  lastVisit: Date;
  loyaltyPoints: number;
}

const CustomerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  phone: { type: String }, // can be null/empty for Walking Customer
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  totalSpent: { type: Number, default: 0 },
  lastVisit: { type: Date, default: Date.now },
  loyaltyPoints: { type: Number, default: 0 }
});

// Compound unique index for non-null phone within a store, but wait,
// since walking customers can have null phone, we can make it sparse or handle it by logic
// Or index phone + storeId but ignore if phone is null.
// Let's create a compound index for phone and storeId. If phone is optional, we can do:
CustomerSchema.index({ phone: 1, storeId: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string' } } });

export default model<ICustomer>('Customer', CustomerSchema);
