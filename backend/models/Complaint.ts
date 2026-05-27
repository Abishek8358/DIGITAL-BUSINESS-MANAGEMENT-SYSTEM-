import { Schema, model, Document, Types } from 'mongoose';

export interface IComplaint extends Document {
  storeId: Types.ObjectId;
  employeeId: Types.ObjectId;
  message: string;
  status: 'pending' | 'resolved';
  createdAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>({
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default model<IComplaint>('Complaint', ComplaintSchema);
