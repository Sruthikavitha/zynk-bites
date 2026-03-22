import type { Request, Response } from 'express';
import { getAllChefs, getPendingChefs, getChefById } from '../models/chefQueries.js';
import { updateUser } from '../models/userQueries.js';
import { notifyChefApproved } from '../services/notificationService.js';

const mapAdminChef = (chef: any) => ({
  id: String(chef.id),
  name: chef.fullName,
  email: chef.email,
  role: 'chef',
  status: chef.isActive ? 'approved' : 'pending',
  specialty: chef.specialty || chef.chefBusinessName || 'Home Chef',
  bio: chef.bio || '',
  serviceArea: chef.serviceArea || '',
  phone: chef.phone || null,
  isDisabled: !chef.isActive,
  createdAt: chef.createdAt ? new Date(chef.createdAt).toISOString() : new Date().toISOString(),
});

export const getPendingChefApprovals = async (_req: Request, res: Response) => {
  try {
    const chefs = await getPendingChefs();
    return res.json({ success: true, data: chefs.map(mapAdminChef) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || 'Failed to load pending chefs' });
  }
};

export const getAllChefApprovals = async (_req: Request, res: Response) => {
  try {
    const chefs = await getAllChefs();
    return res.json({ success: true, data: chefs.map(mapAdminChef) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || 'Failed to load chefs' });
  }
};

export const approveChef = async (req: Request, res: Response) => {
  try {
    const chefId = Number(req.params.id);
    if (!Number.isInteger(chefId) || chefId < 1) {
      return res.status(400).json({ success: false, message: 'Invalid chef id' });
    }

    const chef = await getChefById(chefId);
    if (!chef || chef.role !== 'chef') {
      return res.status(404).json({ success: false, message: 'Chef not found' });
    }

    if (chef.isActive) {
      return res.status(409).json({ success: false, message: 'Chef is already approved' });
    }

    const updated = await updateUser(chefId, { isActive: true });
    await notifyChefApproved(chefId);
    return res.json({
      success: true,
      message: 'Chef approved successfully',
      chef: updated ? mapAdminChef(updated) : mapAdminChef({ ...chef, isActive: true }),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || 'Failed to approve chef' });
  }
};
