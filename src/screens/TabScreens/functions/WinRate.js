export const getWinRate = (total = 0, wins = 0) => {
  if (!total || total <= 0) return '0%';
  return `${((wins / total) * 100).toFixed(1)}%`;
};