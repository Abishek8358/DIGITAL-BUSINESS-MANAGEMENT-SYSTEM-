import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import StoreSettings from '../models/StoreSettings';

// GET all employees
export const getEmployees = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (req.user.role === 'employee') return res.sendStatus(403);

  try {
    const employees = await User.find({
      storeId: req.user.store_id,
      role: { $in: ['employee', 'manager', 'sales', 'helper'] }
    })
    .sort({ status: 1, createdAt: -1 })
    .lean();

    const formatted = employees.map((e: any) => ({
      id: e._id.toString(),
      email: e.email,
      role: e.role,
      name: e.name,
      status: e.status,
      salary: e.salary,
      joinDate: e.joinDate,
      phone: e.phone || '',
      shop: e.shop || '',
      createdAt: e.createdAt
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST create employee
export const createEmployee = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (req.user.role === 'employee') return res.sendStatus(403);

  const { email, password, name, role = 'employee', salary, joinDate, phone, shop } = req.body;
  
  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    let finalSalary = salary;
    if (!finalSalary) {
      // Lookup default salaries from settings
      const settings = await StoreSettings.findOne({ storeId: req.user.store_id });
      if (settings) {
        if (role === 'sales') finalSalary = settings.defaultSalesSalary;
        else if (role === 'manager') finalSalary = settings.defaultManagerSalary;
        else finalSalary = settings.defaultHelperSalary;
      }
    }

    const employee = new User({
      email,
      password: hash,
      role,
      name,
      status: 'active',
      storeId: req.user.store_id,
      salary: parseFloat(finalSalary) || 0,
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      phone,
      shop
    });
    await employee.save();

    res.json({ success: true });
  } catch (err: any) {
    console.error('Create Employee Error:', err);
    res.status(400).json({ message: 'Email already exists or invalid data' });
  }
};

// PUT update employee
export const updateEmployee = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (req.user.role === 'employee') return res.sendStatus(403);

  const { name, email, phone, salary, role, status, joinDate, shop } = req.body;
  try {
    const employee = await User.findOne({ _id: req.params.id, storeId: req.user.store_id });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    employee.name = name ?? employee.name;
    employee.email = email ?? employee.email;
    employee.phone = phone ?? employee.phone;
    employee.salary = salary !== undefined ? parseFloat(salary) : employee.salary;
    employee.role = role ?? employee.role;
    employee.status = status ?? employee.status;
    employee.joinDate = joinDate ? new Date(joinDate) : employee.joinDate;
    employee.shop = shop ?? employee.shop;

    await employee.save();
    res.json({ success: true });
  } catch (err: any) {
    console.error('Employee Update Error:', err);
    res.status(500).json({ error: err.message });
  }
};
