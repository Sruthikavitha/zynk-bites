import { createUser, getUserByEmail } from '../models/userQueries.js';
import { hashPassword } from '../utils/bcrypt.js';

export const ensureDefaultAdminUser = async () => {
  const email =
    process.env.ADMIN_EMAIL ||
    (process.env.NODE_ENV !== 'production' ? 'admin@zynk.com' : '');
  const password =
    process.env.ADMIN_PASSWORD ||
    (process.env.NODE_ENV !== 'production' ? 'admin123' : '');

  if (!email || !password) return;

  const existingAdmin = await getUserByEmail(email);
  if (existingAdmin) return;

  const passwordHash = await hashPassword(password);

  await createUser({
    fullName: 'ZYNK Admin',
    email,
    passwordHash,
    role: 'admin',
    isActive: true,
    phone: null,
    chefBusinessName: null,
    specialty: null,
    bio: null,
    serviceArea: null,
  });
};
