export const getCutoffForDate = (dateStr: string): Date => {
  const date = new Date(`${dateStr}T00:00:00`);
  const cutoff = new Date(date);
  cutoff.setDate(date.getDate() - 1);
  cutoff.setHours(20, 0, 0, 0);
  return cutoff;
};

export const isBeforeMealCutoff = (dateStr: string): boolean => {
  const now = new Date();
  return now.getTime() < getCutoffForDate(dateStr).getTime();
};
