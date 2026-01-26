// Check if skip/swap is locked based on current time
// Logic: Lock activates Friday 8 PM until end of day
export const isSkipSwapLockedByTime = (): boolean => {
  const now = new Date();
  const day = now.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
  const hours = now.getHours();

  // Friday (day 5) from 20:00 (8 PM) onwards is locked
  // Also locked on Saturday and Sunday
  if (day === 5 && hours >= 20) {
    return true; // Friday 8 PM onwards
  }
  if (day === 6 || day === 0) {
    return true; // Saturday and Sunday
  }

  return false; // Can skip/swap Monday-Friday before 8 PM
};

// Get next Friday 8 PM timestamp
export const getNextLockTime = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7; // Calculate days to next Friday

  const nextFriday = new Date(now);
  nextFriday.setDate(nextFriday.getDate() + daysUntilFriday);
  nextFriday.setHours(20, 0, 0, 0); // 8 PM

  return nextFriday;
};

// Calculate next billing date (first day of next month)
export const getNextBillingDate = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
};

// Validate subscription data
export const validateSubscriptionData = (data: any): { valid: boolean; error?: string } => {
  if (!data.planName || typeof data.planName !== 'string') {
    return { valid: false, error: 'planName is required and must be a string' };
  }

  if (!data.mealsPerWeek || data.mealsPerWeek < 1) {
    return { valid: false, error: 'mealsPerWeek must be at least 1' };
  }

  if (!data.priceInCents || data.priceInCents < 0) {
    return { valid: false, error: 'priceInCents is required and must be non-negative' };
  }

  if (!data.deliveryAddress || typeof data.deliveryAddress !== 'string') {
    return { valid: false, error: 'deliveryAddress is required' };
  }

  if (!data.postalCode || typeof data.postalCode !== 'string') {
    return { valid: false, error: 'postalCode is required' };
  }

  if (!data.city || typeof data.city !== 'string') {
    return { valid: false, error: 'city is required' };
  }

  return { valid: true };
};
