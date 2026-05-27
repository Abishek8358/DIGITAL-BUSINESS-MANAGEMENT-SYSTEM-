import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'employee' | 'manager' | 'sales' | 'helper' | 'owner';
  storeId: Types.ObjectId;
  status: 'active' | 'inactive';
  salary?: number;
  joinDate?: Date;
  phone?: string;
  shop?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'employee', 'manager', 'sales', 'helper', 'owner'], 
    default: 'employee' 
  },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  salary: { type: Number, default: 0 },
  joinDate: { type: Date, default: Date.now },
  phone: { type: String },
  shop: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default model<IUser>('User', UserSchema);
