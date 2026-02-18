
// Check if current time is before 8 PM
export const isBeforeCutoff = (): boolean => {
    const now = new Date();
    const cutoffHour = 20; // 8 PM
    return now.getHours() < cutoffHour;
};

// Get tomorrow's date in YYYY-MM-DD format
export const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
};
