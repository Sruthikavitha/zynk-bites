import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Hash a plain text password with bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  // Generate salt and hash password (10 rounds is standard)
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Compare a plain text password with a bcrypt hash
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  // Returns true if password matches the hash, false otherwise
  return await bcrypt.compare(password, hash);
};
