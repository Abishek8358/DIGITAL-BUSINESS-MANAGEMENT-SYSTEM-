import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Complaint from '../models/Complaint';

// POST submit a complaint (Employee)
export const createComplaint = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  const { message } = req.body;
  
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const complaint = new Complaint({
      storeId: req.user.store_id,
      employeeId: req.user.id,
      message: message.trim(),
      status: 'pending'
    });
    await complaint.save();
    
    res.json({ success: true, id: complaint._id.toString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET all complaints for store (Admin Only)
export const getComplaints = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin only' });
  }

  try {
    const complaints = await Complaint.find({ storeId: req.user.store_id })
      .populate('employeeId')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = complaints.map((c: any) => ({
      id: c._id.toString(),
      message: c.message,
      status: c.status,
      createdAt: c.createdAt,
      employeeName: c.employeeId ? c.employeeId.name : 'Unknown Employee',
      employeeEmail: c.employeeId ? c.employeeId.email : '',
      employeeRole: c.employeeId ? c.employeeId.role : ''
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET pending complaints count (Admin Only)
export const getPendingComplaintsCount = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) {
    return res.json({ count: 0 });
  }

  try {
    const count = await Complaint.countDocuments({ storeId: req.user.store_id, status: 'pending' });
    res.json({ count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH/PUT resolve a complaint (Admin Only)
export const resolveComplaint = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin only' });
  }

  try {
    const complaint = await Complaint.findOneAndUpdate(
      { _id: req.params.id, storeId: req.user.store_id },
      { status: 'resolved' },
      { new: true }
    );

    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
