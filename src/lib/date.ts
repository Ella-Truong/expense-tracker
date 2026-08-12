export function getWeeklySummaryRange() {
  // get current day by using Date class 
  const now = new Date();

  // Only generate the weekly summary on Sunday
  if (now.getDay() !== 0) {
    return null;
  }

  // Monday 00:00:00
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);

  // Sunday 23:59:59.999
  const endOfWeek = new Date(now);
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    startOfWeek,
    endOfWeek,
  };
}